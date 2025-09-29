import request from 'sync-request-curl';
import { Options } from '../src';
import { HOST, PORT, PROTOCOL } from './app/constants';

export const START_COMMAND = 'npm start';
export const START_COMMAND_2 = 'npm run start2';

export const COMMON_OPTS: Options & { usedPortAction: 'kill' } = {
  port: PORT,
  debug: false,
  usedPortAction: 'kill',
  isServerReadyFn: () => {
    try {
      const response = request('GET', `${PROTOCOL}://${HOST}:${PORT}`);
      return Boolean(response.getJSON('utf-8').message);
    } catch {
      return false;
    }
  },
};
