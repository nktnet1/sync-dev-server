import { ChildProcess } from 'child_process';

export type UsedPortAction = 'error' | 'ignore' | 'kill';

export interface Options {
  host?: string;
  port?: number;
  timeout?: number;
  debug?: boolean;
  signal?: string | number;
  usedPortAction?: UsedPortAction;
  env?: Record<string, string>;
  isServerReadyFn?: (() => boolean) | null;
}

export interface SyncServer {
  process: ChildProcess;
  opts: Required<Options>;
}
