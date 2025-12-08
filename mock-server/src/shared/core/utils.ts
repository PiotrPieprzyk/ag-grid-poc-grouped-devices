/**
 * Simulate network latency by delaying the execution
 * @param fn - Function to execute after delay
 * @param delayMs - Delay in milliseconds (default: 500ms)
 * @returns Promise that resolves with the function result
 */
export async function simulateLatency<T>(
  fn: () => T,
  delayMs: number = 500
): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return fn();
}
