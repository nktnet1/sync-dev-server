import { ChildProcess } from 'child_process';
import { expect, test } from 'vitest';
import { startServer, stopServer } from '../src';
import { COMMON_OPTS, START_COMMAND, START_COMMAND_2 } from './testConstants';

test('Invalid command', () => {
  expect(() => startServer('')).toThrow(Error);
});

test('Server will not start error', () => {
  expect(() => startServer('sleep 10', { timeout: 1000 })).toThrow(Error);
});

test('Server 2 is immune to SIGTERM', { timeout: 10_000 }, () => {
  const existingServer = startServer(START_COMMAND_2, { ...COMMON_OPTS });
  expect(() =>
    startServer(START_COMMAND, {
      ...COMMON_OPTS,
      usedPortAction: 'kill',
      signal: 'SIGTERM',
      timeout: 5000,
    }),
  ).toThrow(Error);

  stopServer(existingServer, 'SIGINT');
});

test('stopping null, simply ignores', () => {
  expect(() => stopServer(null)).not.toThrow(Error);
});

test('stopping undefined pid gives error', () => {
  expect(() => stopServer({ pid: undefined } as ChildProcess)).toThrow(Error);
});
