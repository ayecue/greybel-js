import { ExecuteOptions, Session, SessionEnvironmentType } from './execute/types.js';
import EnvMapper from './helper/env-mapper.js';
import { MockSession } from './execute/mock/session.js';

export default async function execute(
  target: string,
  options: Partial<ExecuteOptions> = {}
): Promise<boolean> {
  const envMapper = new EnvMapper();
  let session: Session;

  envMapper.load(options.envFiles, options.envVars);

  if (options.envType === SessionEnvironmentType.Mock) {
    session = new MockSession({
      target,
      envMapper,
      debugMode: options.debugMode,
      seed: options.seed
    });
  }

  await session.prepare();

  return await session.run(options.params);
}
