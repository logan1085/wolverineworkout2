/**
 * Minimal logging helper.
 *
 * The app used to `console.log` raw user messages, full AI responses, retrieved
 * memories and user ids on every request. In production that writes personal
 * fitness data - and anything a user types into chat - into the platform log
 * sink, where it is retained and searchable. Two rules follow:
 *
 *   - `debug` is a no-op outside development, so verbose payload logging cannot
 *     reach a production log.
 *   - `error` always runs, but callers must pass a message rather than a raw
 *     request/response object.
 *
 * Secrets specifically must never be passed to any of these. `redact` exists for
 * the cases where an identifier genuinely helps correlate a log line.
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Shorten an identifier so logs can correlate requests without carrying the
 * full value: `a1b2c3d4-...` becomes `a1b2c3…`.
 */
export function redact(value: string | null | undefined): string {
  if (!value) return '<none>';
  if (value.length <= 6) return '…';
  return `${value.slice(0, 6)}…`;
}

export const log = {
  /** Development-only. Safe place for payload-shaped detail. */
  debug(...args: unknown[]): void {
    if (isDev) console.log(...args);
  },

  /** Always emitted. Keep to short, non-sensitive messages. */
  warn(...args: unknown[]): void {
    console.warn(...args);
  },

  /** Always emitted. Keep to short, non-sensitive messages. */
  error(...args: unknown[]): void {
    console.error(...args);
  },
};
