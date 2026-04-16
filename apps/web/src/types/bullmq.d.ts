declare module "bullmq" {
  /** Error especial: el worker no reintenta el job (p. ej. validación 422 definitiva). */
  export class UnrecoverableError extends Error {
    constructor(message?: string);
  }

  export class Queue<T = unknown> {
    constructor(name: string, opts?: unknown);
    add(name: string, data: T, opts?: unknown): Promise<unknown>;
    close(): Promise<void>;
    getJobCounts(...types: string[]): Promise<Record<string, number>>;
    getJobs(types: string[], start: number, end: number): Promise<Array<Job<T>>>;
  }
  export class Worker<T = unknown> {
    constructor(
      name: string,
      processor: (job: Job<T>) => Promise<unknown>,
      opts?: unknown,
    );
    on(event: string, fn: (...args: unknown[]) => void): void;
    close(): Promise<void>;
  }
  export type Job<T = unknown> = {
    name: string;
    data: T;
    attemptsMade: number;
    opts: { attempts?: number };
    retry(): Promise<void>;
  };
}
