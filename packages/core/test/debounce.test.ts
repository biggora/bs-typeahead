import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '../src/debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires on the trailing edge', () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);

    d();
    d();
    d();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes the latest args to the underlying function', () => {
    const fn = vi.fn();
    const d = debounce(fn, 50);

    d('a');
    d('b');
    d('c');
    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledWith('c');
  });

  it('cancel() suppresses the pending call', () => {
    const fn = vi.fn();
    const d = debounce(fn, 50);

    d();
    d.cancel();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();
  });
});
