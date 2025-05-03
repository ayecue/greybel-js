import { HandlerContainer, ObjectValue } from 'greybel-interpreter';
import { Interpreter } from 'greyscript-interpreter';
import { ModifierType } from 'another-ansi';
import {
  PrepareError,
  RuntimeError
} from 'greybel-interpreter';
import EnvMapper from '../../helper/env-mapper.js';
import { InterpreterResourceProvider } from '../../helper/resource';
import {
  createGHMockEnv,
  init as initGHIntrinsics
} from 'greybel-gh-mock-intrinsics';
import { init as initIntrinsics } from 'greybel-intrinsics';
import CLIOutputHandler from './output.js';
import GreybelPseudoDebugger from './debugger.js';
import { Session, SessionOptions } from '../types.js';
import { logger } from '../../helper/logger.js';
import { ansiProvider, useColor } from '../output.js';

export interface MockSessionOptions extends SessionOptions {
  seed?: string;
}

export class MockSession implements Session {
  private target: string;
  private debugMode: boolean;
  private envMapper: EnvMapper;
  private resourceHandler: InterpreterResourceProvider;
  private runtime: Interpreter;
  private seed?: string;

  constructor({
    target,
    envMapper,
    debugMode = false,
    seed
  }: MockSessionOptions) {
    this.target = target;
    this.seed = seed;
    this.debugMode = debugMode;
    this.resourceHandler = new InterpreterResourceProvider();
    this.envMapper = envMapper;
    this.runtime = null;
  }

  async prepare() {
    this.runtime = new Interpreter({
      target: await this.resourceHandler.resolve(this.target),
      handler: new HandlerContainer({
        outputHandler: new CLIOutputHandler(),
        resourceHandler: this.resourceHandler
      }),
      environmentVariables: this.envMapper.toMap(),
      debugMode: this.debugMode
    });

    this.runtime.setApi(
      initIntrinsics(
        initGHIntrinsics(
          new ObjectValue(),
          createGHMockEnv(this.runtime, {
            seed: this.seed,
            myProgramContent: await this.resourceHandler.get(this.target)
          })
        )
      )
    );

    this.runtime.setDebugger(new GreybelPseudoDebugger(this.runtime));
  }

  async run(params: string[] = []): Promise<boolean> {
    try {
      const startTime = Date.now();
      this.runtime.params = params;
      await this.runtime.run();
      logger.debug(`Execution time: ${Date.now() - startTime}ms`);
    } catch (err: any) {
      if (err instanceof PrepareError) {
        logger.error(
          useColor(
            'red',
            `${ansiProvider.modify(ModifierType.Bold, 'Prepare error')}: ${err.message
            } at ${err.target}:${err.range?.start || 0}`
          )
        );
      } else if (err instanceof RuntimeError) {
        logger.error(
          useColor(
            'red',
            `${ansiProvider.modify(ModifierType.Bold, 'Runtime error')}: ${err.message
            } at ${err.target}\n${err.stack}`
          )
        );
      } else {
        logger.error(
          useColor(
            'red',
            `${ansiProvider.modify(ModifierType.Bold, 'Unexpected error')}: ${err.message
            }\n${err.stack}`
          )
        );
      }

      return false;
    }

    return true;
  }
}