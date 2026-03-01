/**
 * Simple rate limiter with exponential backoff for retries.
 */

/** Wait for the specified number of milliseconds. */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retries and exponential backoff.
 *
 * @param fn        The async function to execute.
 * @param maxRetries Maximum number of retry attempts (default 3).
 * @param baseDelay  Base delay in ms before first retry (default 2000).
 * @returns          The result of fn.
 * @throws           The last error if all retries fail.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const backoff = baseDelay * Math.pow(2, attempt);
        // Add jitter: ±25%
        const jitter = backoff * (0.75 + Math.random() * 0.5);
        await delay(Math.round(jitter));
      }
    }
  }

  throw lastError!;
}
