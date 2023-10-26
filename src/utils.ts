import netstat, { SyncResult } from 'node-netstat';
import { Options } from './types';
import slync from 'slync';
import killSync from 'kill-sync';

/**
 * Get the netstat information for a given port and host.
 * - https://github.com/danielkrainas/node-netstat
 *
 * @param {number} port - The port to check.
 * @param {string} [host] - The host to check (optional)
 * @returns {SyncResult} - The synchronous netstat result
 */
export const getNetstat = (port: number, host?: string): SyncResult => {
  let results: SyncResult;
  const address = host === 'localhost' ? '::1' : host;
  const local = {
    port,
    ...(address ? { address } : {})
  };
  netstat({
    sync: true,
    filter: {
      local,
      state: 'LISTEN'
    },
    limit: 1,
  }, (ret) => {
    results = ret;
  });
  return results;
};

/**
 * Blocks the event-loop to synchronously "await" for the server to either
 * start or stop depending on the given boolean
 *
 * @param {Required<Options>} opts - includes port/host/timeout
 * @param {boolean} toStart - wait for start or wait for stop
 * @returns {boolean} - True if started/stopped within timeout, false otherwise
 */
export const waitForServerToStartOrStop = (opts: Required<Options>, toStart: boolean): boolean => {
  const ms = 200;
  for (let time = 0; time < opts.timeout; time += ms) {
    const results = getNetstat(opts.port, opts.host);
    if (Boolean(results) === toStart) {
      return true;
    }
    slync(ms);
  }
  return false;
};

/**
 * Kill a server synchronously and "await" for it to stop.
 * - Ohttps://github.com/nktnet1/kill-sync
 *
 * @param {number} pid - The process ID of the server to kill.
 * @param {Required<Options>} opts - The options for killing the server.
 */
export const killServerSync = (pid: number, opts: Required<Options>) => {
  killSync(pid, opts.signal, true);
  if (!waitForServerToStartOrStop(opts, false)) {
    throw new Error(`
>>> Failed to kill server:
${JSON.stringify(getNetstat(opts.port, opts.host), null, 2)}

>>> Options:
${JSON.stringify(opts, null, 2)}
    `);
  }
};

/**
 * Throws error if another server is running and opts.error is specified.
 * Kills the conflicting server if opts.kill is pecified.
 *
 * @param {Required<Options>} opts - The options for handling a used port.
 * @param {SyncResult} netstatResult - The netstat result for the used port
 */
export const handleUsedPortErrorOrKill = (opts: Required<Options>, netstatResult: SyncResult) => {
  if (netstatResult !== undefined) {
    if (opts.usedPortAction === 'error') {
      throw new Error(`Port ${opts.port} is already taken.`);
    }
    if (opts.usedPortAction === 'kill') {
      killServerSync(netstatResult.pid, opts);
    }
  }
};
