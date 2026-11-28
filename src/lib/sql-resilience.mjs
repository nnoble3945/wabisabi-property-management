/**
 * Azure SQL serverless can take time to resume after auto-pause.
 * Only connection/network failures and explicitly documented transient SQL numbers
 * are eligible for retries. Firewall and authentication failures are NOT transient.
 */
const RETRYABLE_CODES = new Set([
  'ETIMEOUT', 'ESOCKET', 'ECONNCLOSED', 'ETIMEDOUT', 'ECONNRESET',
  'EHOSTUNREACH', 'ENETUNREACH', 'EAI_AGAIN', 'ECONNREFUSED',
]);
const RETRYABLE_SQL_NUMBERS = new Set([
  40613, // Database unavailable (for example, resuming or failing over)
  40197, 40501, 10928, 10929, 49918, 49919, 49920,
]);

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isTransientSqlError(error) {
  const visited = new Set();
  let current = error;

  for (let depth = 0; depth < 6 && current && typeof current === 'object'; depth += 1) {
    if (visited.has(current)) break;
    visited.add(current);

    const code = typeof current.code === 'string' ? current.code.toUpperCase() : null;
    const number = Number(current.number);
    if (code && RETRYABLE_CODES.has(code)) return true;
    if (Number.isInteger(number) && RETRYABLE_SQL_NUMBERS.has(number)) return true;

    current = current.originalError ?? current.cause;
  }
  return false;
}

const defaultWait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry connection establishment only, never an INSERT/UPDATE/DELETE or any query.
 * @template T
 * @param {() => Promise<T>} connect
 * @param {{ delaysMs?: number[], wait?: (ms: number) => Promise<void>,
 *   onRetry?: (attempt: number, error: unknown) => void }} [options]
 * @returns {Promise<T>}
 */
export async function retryTransientSqlConnection(connect, options = {}) {
  const delaysMs = options.delaysMs ?? [2000, 5000];
  const wait = options.wait ?? defaultWait;

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await connect();
    } catch (error) {
      if (!isTransientSqlError(error) || attempt >= delaysMs.length) throw error;
      options.onRetry?.(attempt + 1, error);
      await wait(delaysMs[attempt]);
    }
  }
}
