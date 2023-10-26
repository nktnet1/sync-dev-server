import { Options, UsedPortAction } from './types';
import { ChildProcess, spawn } from 'child_process';
import { handleUsedPortErrorOrKill, getNetstat, waitForServerToStartOrStop } from './utils';
import killSync from 'kill-sync';
import { Transform } from 'stream';

const defaultOptions: Required<Options> = {
  port: 5000,
  host: '',
  timeout: 10000,
  signal: 'SIGTERM',
  debug: true,
  usedPortAction: 'error',
  env: {},
};

/**
 * Stops the given server
 *
 * @param {ChildProcess | null} server - The server's child process or null
 * @param {number|string} [signal='SIGTERM'] - Signal to terminate the server
 */
export const stopServer = (server: ChildProcess | null, signal: number | string = 'SIGTERM'): void => {
  if (server === null) {
    return;
  }
  if (server.pid === undefined) {
    throw new Error('Given child process has undefined pid');
  }
  killSync(server.pid, signal, true);
};

/**
 * Start a server process based on the provided command and options.
 *
 * @param {string} command - The command to start the server
 * @param {Options} [options={}] - The options for starting the server
 * @returns {ChildProcess | null} - The spawned server child process
 */
export function startServer(
  command: string,
  options?: { usedPortAction: 'ignore' } & Options
): ChildProcess | null;
export function startServer(
  command: string,
  options?: { usedPortAction: Exclude<UsedPortAction, 'ignore'> } & Options
): ChildProcess;
export function startServer(
  command: string,
  options?: Options
): ChildProcess | null;
export function startServer(
  command: string,
  options: Options = {}
): ChildProcess | null {
  const opts = { ...defaultOptions, ...options };
  const args = command.split(' ');
  const cmd = args.shift();
  if (!cmd) {
    throw new Error(`Command is empty: ${command}`);
  }
  const currPortNetstat = getNetstat(opts.port, opts.host);
  handleUsedPortErrorOrKill(opts, currPortNetstat);
  // console.log('currPortNetstat', currPortNetstat);
  if (currPortNetstat !== undefined && opts.usedPortAction === 'ignore') {
    return null;
  }
  const server = spawn(cmd, args, { env: opts.env });
  if (!waitForServerToStartOrStop(opts, true)) {
    stopServer(server, opts.signal);
    throw new Error(`
Failed to start server after ${opts.timeout} milliseconds.

Please double check that you've specified the correct options, as
the default options may not meet your needs (e.g. opts.port):

${JSON.stringify(opts, null, 2)}
    `);
  }

  const serverLogPrefixer = new Transform({
    /* istanbul ignore next */
    transform(chunk, _encoding, callback) {
      this.push((`[sync-dev-server] ${chunk.toString()}`));
      callback();
    },
  });

  if (opts.debug) {
    server.stdout.pipe(serverLogPrefixer).pipe(process.stdout);
  } else {
    /* istanbul ignore next */
    server.stdout.on('data', () => { /* nothing to do */ });
  }

  return server;
}
