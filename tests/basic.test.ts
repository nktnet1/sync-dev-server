import request from 'sync-request-curl';
import { CurlError } from 'sync-request-curl/errors';
import { beforeEach, afterEach, expect, test } from 'vitest';
import { startServer, stopServer } from '../src';
import { SyncServer } from '../src/types';
import { SERVER_URL } from './app/constants';
import { START_COMMAND, START_COMMAND_2, COMMON_OPTS } from './testConstants';

let server: SyncServer;
beforeEach(() => {
  server = startServer(START_COMMAND, { ...COMMON_OPTS });
});

afterEach(() => {
  stopServer(server);
});

test('Stop server with default SIGTERM', () => {
  expect(request('GET', SERVER_URL).statusCode).toStrictEqual(200);
  stopServer(server);
  expect(() => request('GET', SERVER_URL).statusCode).toThrow(CurlError);
});

test('Stop server with SIGINT', () => {
  expect(request('GET', SERVER_URL).statusCode).toStrictEqual(200);
  stopServer(server, 'SIGINT');
  expect(() => request('GET', SERVER_URL).statusCode).toThrow(CurlError);
});

test("Starts another server, { usedPortAction: 'error' } gives Error", () => {
  expect(() => startServer(START_COMMAND, { ...COMMON_OPTS, usedPortAction: 'error' })).toThrow(
    Error,
  );
});

test("Starts another server, { usedPortAction: 'ignore' } uses the old server, returns null", () => {
  expect(startServer(START_COMMAND, { ...COMMON_OPTS, usedPortAction: 'ignore' })).toStrictEqual(
    null,
  );
  expect(request('GET', SERVER_URL).statusCode).toStrictEqual(200);
});

test("Starts another server, { usedPortAction: 'kill' } uses the new server", () => {
  const res1 = request('GET', SERVER_URL);
  expect(JSON.parse(res1.body.toString())).toStrictEqual({ message: 'Welcome to server1!' });
  expect(res1.statusCode).toStrictEqual(200);
  const server2 = startServer(START_COMMAND_2, {
    ...COMMON_OPTS,
    usedPortAction: 'kill',
    signal: 'SIGINT',
  });
  const res2 = request('GET', SERVER_URL);
  expect(JSON.parse(res2.body.toString())).toStrictEqual({ message: 'Welcome to server2!' });
  stopServer(server2, 'SIGINT');
});
