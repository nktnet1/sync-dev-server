import { Options } from '../src';
import { PORT } from './app/constants';

export const START_COMMAND = 'npm start';
export const START_COMMAND_2 = 'npm run start2';

export const COMMON_OPTS: Options & { usedPortAction: 'kill' } = Object.freeze({
  port: PORT,
  debug: false,
  usedPortAction: 'kill',
  timeout: 60000
});
