/**
 * Conditional logger — no-ops in production builds
 * Usage: import { devLog, devWarn } from '@/lib/logger';
 */

const noop = () => {};

export const devLog: typeof console.log = import.meta.env.DEV
  ? console.log.bind(console)
  : noop;

export const devWarn: typeof console.warn = import.meta.env.DEV
  ? console.warn.bind(console)
  : noop;
