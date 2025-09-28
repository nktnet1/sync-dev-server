import { ChildProcess } from 'child_process';
import { sync as commandExistsSync } from 'command-exists';
import { Options, UsedPortAction } from './types';
import { handleUsedPortErrorOrKill, getNetstat, killPid, createServerSync } from './utils';

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
export const stopServer = (
  server: ChildProcess | null,
  signal: number | string = 'SIGTERM',
): void => {
  if (server === null) {
    return;
  }
  killPid(server.pid, signal);
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
  options?: { usedPortAction: 'ignore' } & Options,
): ChildProcess | null;
export function startServer(
  command: string,
  options?: { usedPortAction?: Exclude<UsedPortAction, 'ignore'> } & Options,
): ChildProcess;
export function startServer(command: string, options: Options = {}): ChildProcess | null {
  if (!commandExistsSync('netstat')) {
    throw new Error(
      'Error: the "netstat" command is not in path. Please install net-tools: https://net-tools.sourceforge.io/',
    );
  }
  const opts = { ...defaultOptions, ...options };
  const args = command.split(' ');
  const cmd = args.shift();
  if (!cmd) {
    throw new Error(`Command is empty: ${command}`);
  }
  const currPortNetstat = getNetstat(opts.port, opts.host);
  if (currPortNetstat !== undefined && opts.usedPortAction === 'ignore') {
    return null;
  }
  handleUsedPortErrorOrKill(opts, currPortNetstat);
  return createServerSync(cmd, args, opts);
}
