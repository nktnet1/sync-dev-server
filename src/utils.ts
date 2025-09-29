import { execSync, spawn } from 'child_process';
import { Transform } from 'stream';
import dnsLookupSync from 'dns-lookup-sync';
import killSync from 'kill-sync';
import netstat, { SyncResult } from 'node-netstat';
import slync from 'slync';
import { Options } from './types';

/**
 * Get the PID number from a given port
 * @param port
 */
/* v8 ignore start */
const getPortPid = (port: number): number | null => {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const output = execSync(`lsof -ti:${port}`).toString().split('\n').filter(Boolean);
      return output.length ? Number(output[0]) : null;
    } else if (process.platform === 'win32') {
      const output = execSync(
        `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do @echo %a`,
      )
        .toString()
        .split('\n')
        .filter(Boolean);
      return output.length ? Number(output[0]) : null;
    }
    return null;
  } catch {
    return null;
  }
};
/* v8 ignore stop */

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
  const address = host === 'localhost' ? dnsLookupSync(host).address : host;

  const local = {
    port,
    ...(address ? { address } : {}),
  };
  netstat(
    {
      sync: true,
      filter: {
        local,
      },
      limit: 1,
    },
    /* v8 ignore next 3 */
    (ret) => {
      results = ret;
    },
  );
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
  const isReadyFn = opts.isServerReadyFn ?? (() => getNetstat(opts.port, opts.host));
  for (let time = 0; time < opts.timeout; time += ms) {
    if (Boolean(isReadyFn()) === toStart) {
      return true;
    }
    slync(ms);
  }
  return false;
};

/**
 * Kill a process recursively by its pid
 *
 * @param {number | undefined} pid process identifier to kill
 * @param signal IPC signal, e.g. SIGTERM
 * @throws Error if the given pid is undefined
 */
export const killPid = (pid: number | undefined, signal?: string | number) => {
  if (pid === undefined) {
    throw new Error('The given server child process has undefined pid!');
  }
  /* v8 ignore next 10 */
  try {
    killSync(pid, signal, true);
  } catch (error: unknown) {
    console.error(`\
WARNING - failed to kill server with pid ${pid} using signal ${signal ?? 'SIGTERM'}.

ERROR STACK:
  ${(error as Error).stack}
    `);
  }
};

/**
 * Kill a server synchronously and "await" for it to stop.
 * - Ohttps://github.com/nktnet1/kill-sync
 *
 * @param {number} pid - The process ID of the server to kill.
 * @param {Required<Options>} opts - The options for killing the server.
 * @throws Error if the given pid is undefined or the server cannot be killed
 */
export const killServerSync = (opts: Required<Options>, pid: number) => {
  killPid(pid, opts.signal);

  if (!waitForServerToStartOrStop(opts, false)) {
    throw new Error(`
>>> Failed to kill server.

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
export const handleUsedPortErrorOrKill = (
  opts: Required<Options>,
  netstatResult: SyncResult,
  isActive: boolean,
) => {
  if (isActive) {
    if (opts.usedPortAction === 'error') {
      throw new Error(`Port ${opts.port} is already taken.`);
    }
    if (opts.usedPortAction === 'kill') {
      /* v8 ignore next */
      const pid = netstatResult?.pid ?? getPortPid(opts.port);

      /* v8 ignore next 3 */
      if (!pid) {
        throw new Error('Failed to kill existing server - missing pid');
      }
      killServerSync(opts, pid);
    }
  }
};

/**
 * Creates a server child process that's actively listening for requests
 *
 * @param {string} cmd command/script to run, e.g. 'npm', 'node'
 * @param {string[]} args arguments to pass to this command
 * @param {Required<Options>} opts options from startServer
 * @returns a server child process that is guaranteed to be running
 */
export const createServerSync = (cmd: string, args: string[], opts: Required<Options>) => {
  const server = spawn(cmd, args, { env: Object.assign(process.env, opts.env) });
  if (!waitForServerToStartOrStop(opts, true)) {
    killPid(server.pid, opts.signal);
    throw new Error(`
Failed to start server after ${opts.timeout} milliseconds.

Please double check that you've specified the correct options, as
the default options may not meet your needs (e.g. opts.port):

${JSON.stringify(opts, null, 2)}
    `);
  }

  const serverLogPrefixer = new Transform({
    /* v8 ignore next 4 */
    transform(chunk, _encoding, callback) {
      this.push(`[sync-dev-server] ${chunk.toString()}`);
      callback();
    },
  });

  if (opts.debug) {
    server.stdout.pipe(serverLogPrefixer).pipe(process.stdout);
  } else {
    /* v8 ignore next */
    server.stdout.on('data', () => {
      /* nothing to do */
    });
  }

  return server;
};
