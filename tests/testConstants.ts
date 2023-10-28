import { Options } from '../src';
import { PORT } from './app/constants';

export const START_COMMAND = 'sleep 10';
export const START_COMMAND_2 = 'sleep 10';

export const COMMON_OPTS: Options & { usedPortAction: 'kill' } = Object.freeze({
  port: PORT,
  debug: false,
  usedPortAction: 'kill',
});
