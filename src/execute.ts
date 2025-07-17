import { InGameSession } from './execute/in-game/session.js';
import { MockSession } from './execute/mock/session.js';
import {
  ExecuteOptions,
  Session,
  SessionEnvironmentType
} from './execute/types.js';
import { configurationManager } from './helper/configuration-manager.js';
import { EnvironmentVariablesManager } from './helper/env-mapper.js';
import { parseFileExtensions } from './helper/parse-file-extensions.js';
import { VersionManager } from './helper/version-manager.js';

export default async function execute(
  target: string,
  options: Partial<ExecuteOptions> = {}
): Promise<boolean> {
  const fileExtensions = parseFileExtensions(options.fileExtensions);

  if (fileExtensions) {
    configurationManager.set('fileExtensions', fileExtensions);
  }

  const envMapper = new EnvironmentVariablesManager();
  const envType = options.envType?.toLocaleLowerCase();
  let session: Session;

  envMapper.load(options.envFiles, options.envVars);

  if (envType === SessionEnvironmentType.Mock) {
    session = new MockSession({
      target,
      envMapper,
      debugMode: options.debugMode,
      seed: options.seed
    });
  } else if (envType === SessionEnvironmentType.Ingame) {
    session = new InGameSession({
      target,
      envMapper,
      debugMode: options.debugMode,
      programName: options.programName,
      port: options.port
    });

    await VersionManager.triggerContextAgentHealthcheck();
  } else {
    throw new Error(
      'Invalid environment type. Please use "Mock" or "In-Game".'
    );
  }

  await session.prepare();

  return await session.run(options.params);
}
