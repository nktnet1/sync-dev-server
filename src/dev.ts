import { ChildProcess } from 'child_process';
import { sync as commandExistsSync } from 'command-exists';
import { Options } from './types';
import { handleUsedPortErrorOrKill, getNetstat, killPid, createServerSync } from './utils';

const defaultOptions: Required<Options> = {
  port: 5000,
  host: '',
  timeout: 10000,
  signal: 'SIGTERM',
  debug: true,
  usedPortAction: 'error',
  env: {},
  isServerReadyFn: null,
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
export type StartServerReturn<T extends Options | undefined> = T extends {
  usedPortAction: 'ignore';
}
  ? ChildProcess | null
  : ChildProcess;

export function startServer<T extends Options | undefined = Options>(
  command: string,
  options?: T,
): StartServerReturn<T> {
  const opts = { ...defaultOptions, ...options };
  const hasNetstat = commandExistsSync('netstat');

  /* v8 ignore next 8 */
  if (!hasNetstat && !opts.isServerReadyFn) {
    console.warn(`\
WARNING: "netstat" command not found in Path.

Please install net-tools: https://net-tools.sourceforge.io/, or otherwise provide
opts.isServerReadyFn
    `);
  }

  const args = command.split(' ');
  const cmd = args.shift();
  if (!cmd) {
    throw new Error(`Command is empty: ${command}`);
  }

  /* v8 ignore next */
  const netstatResult = hasNetstat ? getNetstat(opts.port, opts.host) : undefined;
  const isActive = opts.isServerReadyFn?.() ?? netstatResult !== undefined;
  if (isActive && opts.usedPortAction === 'ignore') {
    return null as StartServerReturn<T>;
  }
  handleUsedPortErrorOrKill(opts, netstatResult, isActive);
  return createServerSync(cmd, args, opts);
}
