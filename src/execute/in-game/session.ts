import { input } from '@inquirer/prompts';
import { ModifierType } from 'another-ansi';
import fs from 'fs';
import GreyHackMessageHookClientPkg from 'greyhack-message-hook-client';
import pathUtils from 'path';

import { findExistingPath } from '../../helper/document-uri-builder.js';
import EnvMapper from '../../helper/env-mapper.js';
import { randomString } from '../../helper/random-string.js';
import { ansiProvider, Terminal, useColor } from '../output.js';
import {
  ClientMessageType,
  ContextBreakpoint,
  Session,
  SessionOptions
} from '../types.js';
import { logger } from '../../helper/logger.js';
import { VersionManager } from '../../helper/version-manager.js';
import { transformInternalKeyEventToKeyEvent } from '../key-event.js';

const { ContextAgent } = GreyHackMessageHookClientPkg;

async function resolveFileExtension(path: string): Promise<string | null> {
  return await findExistingPath(
    path,
    `${path}.src`,
    `${path}.gs`,
    `${path}.ms`
  );
}

export interface InGameSessionOptions extends SessionOptions {
  port?: number;
  programName?: string;
}

function sessionExitHandler(options, exitCode) {
  InGameSession.singleton?.stop();
}

process.on('exit', sessionExitHandler);
process.on('SIGINT', sessionExitHandler);
process.on('SIGUSR1', sessionExitHandler);
process.on('SIGUSR2', sessionExitHandler);
process.on('SIGTERM', sessionExitHandler);
process.on('uncaughtException', sessionExitHandler);

export class InGameSession implements Session {
  static singleton: InGameSession | null = null;

  private target: string;
  private debugMode: boolean;
  private envMapper: EnvMapper;
  private instance: any;
  private terminal: Terminal;
  private internalFileMap: Record<string, string>;
  private temporaryPath: string;
  private agent: any;
  private running: boolean = false;
  private basePath: string | null = null;
  private programName: string;
  private crashed: boolean = false;

  constructor({
    target,
    envMapper,
    debugMode = false,
    port = 7777,
    programName = 'myprogram'
  }: InGameSessionOptions) {
    this.target = pathUtils.resolve(target);
    this.debugMode = debugMode;
    this.envMapper = envMapper;
    this.programName = programName;
    this.basePath = process.cwd();
    this.agent = new ContextAgent(
      {
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {}
      },
      port
    );
    this.instance = null;
    this.terminal = new Terminal();
    this.internalFileMap = {};
    this.temporaryPath = 'temp-' + randomString(10);
    InGameSession.singleton = this;
  }

  async prepare() {
    const healthcheck = await VersionManager.performHealthCheck(this.agent);

    if (!healthcheck.isSingleplayer) {
      logger.error('Can only start in-game debug session with singleplayer running!');
      process.exit(1);
    }

    const resolvedPath = pathUtils.join(
      this.basePath,
      this.temporaryPath
    );

    fs.mkdirSync(resolvedPath);
  }

  async run(params: string[] = []): Promise<boolean> {
    const content = fs.readFileSync(this.target, 'utf8');
    const { value } = await this.agent.createContext(
      `params=[${params
        .map((it) => `"${it.replace(/"/g, '""')}"`)
        .join(',')}];` + content,
      this.target,
      this.basePath,
      this.programName,
      this.debugMode,
      [],
      this.envMapper.toMap(true)
    );
    this.running = true;
    this.instance = value;
    this.registerMessageHandler();
    await this.waitForFinished();
    return !this.crashed;
  }

  private async verifyFilepath(path: string) {
    if (this.internalFileMap[path]) {
      const resolvedPath = pathUtils.join(
        this.basePath,
        this.temporaryPath,
        `${path}.src`
      );
      const content = this.internalFileMap[path];

      fs.writeFileSync(resolvedPath, content);

      return {
        resolvedPath,
        originalPath: path
      };
    }

    const resolvedPath = await resolveFileExtension(path);

    return {
      resolvedPath: resolvedPath ?? path,
      originalPath: path
    };
  }

  private async createFilepathMap(paths: string[]) {
    const resolvedPaths = await Promise.all(
      paths.map(async (it) => this.verifyFilepath(it))
    );

    return resolvedPaths.reduce((result, { resolvedPath, originalPath }) => {
      result[originalPath] = resolvedPath;
      return result;
    }, {});
  }

  private async parseContextBreakpoint(
    contextBreakpoint: any
  ): Promise<ContextBreakpoint> {
    const mappedPaths = await this.createFilepathMap([
      contextBreakpoint.filepath,
      ...contextBreakpoint.stacktrace.map((it) => it.filepath)
    ]);

    return {
      contextID: contextBreakpoint.contextID,
      filepath: mappedPaths[contextBreakpoint.filepath],
      source: contextBreakpoint.source,
      line: contextBreakpoint.line,
      variables: contextBreakpoint.variables,
      stacktrace: contextBreakpoint.stacktrace.map((it) => {
        return {
          filepath: mappedPaths[it.filepath],
          lineNum: it.lineNum,
          name: it.name,
          isExternal: it.isExternal
        };
      })
    };
  }

  private registerMessageHandler() {
    this.instance.on('receive', async (id, response) => {
      switch (id) {
        case ClientMessageType.FinishedContextRpc: {
          this.crashed = response.failed;
          this.stop();
          break;
        }
        case ClientMessageType.ContextBreakpointRpc: {
          logger.info(
            useColor('cyan', ansiProvider.modify(ModifierType.Bold, `REPL - Console`))
          );
          logger.info(
            useColor('cyan', `You can execute code in the current context.`)
          );
          logger.info(``);
          logger.info(
            useColor(
              'cyan',
              `Press "next" or "exit" to either move to the next line or continue execution.`
            )
          );

          const lastBreakpoint = await this.parseContextBreakpoint(response);
          const line = await input({
            message: useColor(
              'cyan',
              `${ansiProvider.modify(
                ModifierType.Bold,
                `[${lastBreakpoint.filepath}:${lastBreakpoint.line}]`
              )} >`
            )
          });

          if (line === 'next') {
            await this.goToNextLine();
          } else if (line === 'exit') {
            await this.setDebugMode(false);
          }

          break;
        }
        case ClientMessageType.DecipherTimeClientRpc: {
          this.terminal.print('Deciphering...');
          await this.endDecipher();
          break;
        }
        case ClientMessageType.SendFileSizeClientRpc: {
          this.terminal.print('Transfer...');
          await this.endDownload();
          break;
        }
        case ClientMessageType.ContextLoadFileRpc: {
          await this.resolveFile(response.filepath);
          break;
        }
        case ClientMessageType.ContextOpenInternalFileRpc: {
          this.internalFileMap[response.filepath] = response.source
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t');
          break;
        }
        case ClientMessageType.PrintSentClientRpc: {
          this.terminal.print(response.output, response.replaceText);
          break;
        }
        case ClientMessageType.ClearScreenClientRpc: {
          this.terminal.clear();
          break;
        }
        case ClientMessageType.InputSentClientRpc: {
          if (response.anyKey) {
            const key = await this.terminal.waitForKeyPress(
              response.output,
              () => this.stop()
            );
            this.instance.sendInput(transformInternalKeyEventToKeyEvent(key));
            break;
          }

          const input = await this.terminal.waitForInput(
            response.isPassword,
            response.output
          );
          this.instance.sendInput(input);
          break;
        }
        case ClientMessageType.ContextUnexpectedErrorRpc: {
          this.crashed = true;
          await this.stop();
          break;
        }
      }
    });
  }

  async waitForFinished() {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!this.running) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
  }

  async setDebugMode(debugMode: boolean) {
    if (this.instance == null) return;
    await this.instance.setDebugMode(debugMode);
  }

  async endDecipher() {
    if (this.instance == null) return;
    await this.instance.endDecipher();
  }

  async endDownload() {
    if (this.instance == null) return;
    await this.instance.endDownload();
  }

  async goToNextLine() {
    if (this.instance == null) return;
    await this.instance.goToNextLine();
  }

  async injectCode(context: string) {
    if (this.instance == null) return;
    await this.instance.injectCode(context);
  }

  private async resolveFile(path: string) {
    if (this.instance == null) return;
    const resolvedPath = await resolveFileExtension(path);
    if (resolvedPath == null) {
      await this.instance.resolvedFile(path, null);
      return;
    }
    const content = fs.readFileSync(resolvedPath, 'utf8');
    await this.instance.resolvedFile(resolvedPath, content);
  }

  async stop() {
    if (this.instance) {
      const agent = this.agent;
      const instance = this.instance;
      const tempFolderPath = pathUtils.join(this.basePath, this.temporaryPath);

      this.instance = null;
      this.agent = null;
      await instance.dispose().catch(console.warn);
      agent.dispose().catch(console.warn);
      
      try {
        fs.rmSync(tempFolderPath, {
          recursive: true,
          force: true
        });
      } catch (err) {
        logger.warn(`Failed to delete temporary folder: ${tempFolderPath}`);
      }

      if (InGameSession.singleton === this) {
        InGameSession.singleton = null;
      }

      this.running = false;
    }
  }
}
