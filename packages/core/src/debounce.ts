// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => unknown;

export interface DebouncedFn<T extends AnyFn> {
  (...args: Parameters<T>): void;
  cancel(): void;
}

/**
 * Trailing-edge debounce. The wrapped function fires `wait` ms after the last
 * call. `cancel()` clears the pending invocation.
 */
export function debounce<T extends AnyFn>(fn: T, wait: number): DebouncedFn<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>): void => {
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, wait);
  };

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}
