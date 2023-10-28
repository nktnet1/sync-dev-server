import { Options } from '../src';
import { PORT } from './app/constants';

export const START_COMMAND = 'npx ts-node tests/app/server1';
export const START_COMMAND_2 = 'npx ts-node tests/app/server2';

export const COMMON_OPTS: Options & { usedPortAction: 'kill' } = Object.freeze({
  port: PORT,
  debug: false,
  usedPortAction: 'kill',
});
