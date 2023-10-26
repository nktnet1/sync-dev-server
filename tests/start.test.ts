import request, { CurlError } from 'sync-request-curl';
import { startServer, stopServer } from '../src';
import { HOST, PORT, PROTOCOL } from './app/constants';
import { START_COMMAND, COMMON_OPTS } from './testConstants';

test("Using localhost for 'host'", () => {
  const newHost = 'localhost';
  expect(newHost).not.toEqual(HOST);
  const server = startServer(START_COMMAND, { ...COMMON_OPTS, host: 'localhost', env: { IP: newHost }, debug: true });
  // Using HOST, no server available
  expect(() => request('GET', `${PROTOCOL}://${HOST}:${PORT}`)).toThrow(CurlError);
  // Using newHost, should be OK (200)
  expect(request('GET', `${PROTOCOL}://${newHost}:${PORT}`).statusCode).toStrictEqual(200);
  stopServer(server);
  expect(() => request('GET', `${PROTOCOL}://${newHost}:${PORT}`)).toThrow(CurlError);
});
