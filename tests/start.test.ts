import os from 'os';
import dnsLookupSync from 'dns-lookup-sync';
import request from 'sync-request-curl';
import { CurlError } from 'sync-request-curl/errors';
import { expect, test } from 'vitest';
import { startServer, stopServer } from '../src';
import { HOST, PORT, PROTOCOL } from './app/constants';
import { START_COMMAND, COMMON_OPTS } from './testConstants';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    if (interfaces?.[name]) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  return null;
}

test("Using local ip for 'host'", () => {
  const localIp = getLocalIp() ?? '';
  if (!localIp) {
    throw new Error('Missing local IP');
  }
  expect(localIp).not.toEqual(HOST);
  const server = startServer(START_COMMAND, {
    ...COMMON_OPTS,
    host: localIp,
    env: { IP: localIp },
    debug: true,
    isServerReadyFn: () => {
      try {
        const response = request('GET', `${PROTOCOL}://${localIp}:${PORT}`, { timeout: 2000 });
        return Boolean(response.getJSON('utf-8').message);
      } catch {
        return false;
      }
    },
  });

  if (dnsLookupSync(localIp).address !== HOST) {
    // Using localIp which is different from original HOST, no server available
    expect(() => request('GET', `${PROTOCOL}://${HOST}:${PORT}`)).toThrow(CurlError);
  }

  // Using localIp, should be OK (200)
  expect(request('GET', `${PROTOCOL}://${localIp}:${PORT}`).statusCode).toStrictEqual(200);
  stopServer(server);
  expect(() => request('GET', `${PROTOCOL}://${localIp}:${PORT}`)).toThrow(CurlError);
});
