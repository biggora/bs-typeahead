import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Typeahead } from '../src/typeahead.js';
import type { Fetcher } from '../src/types.js';

interface City {
  id: number;
  name: string;
}

const cities: City[] = [
  { id: 1, name: 'Toronto' },
  { id: 2, name: 'Tokyo' },
];

function makeInput(): HTMLInputElement {
  const input = document.createElement('input');
  document.body.append(input);
  return input;
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
} {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('Typeahead — Phase 3 (async source)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the fetcher with the current query after the debounce window', async () => {
    const fetcher = vi.fn<Fetcher<City>>(async () => cities);
    const ta = new Typeahead<City>(makeInput(), {
      source: fetcher,
      displayField: 'name',
      debounceMs: 100,
    });

    ta.setQuery('to');
    expect(fetcher).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(fetcher).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[0]).toBe('to');
    expect(fetcher.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);

    await vi.runAllTimersAsync();
    expect(ta.items).toEqual(cities);
  });

  it('does not call the fetcher when query is shorter than minLength', () => {
    const fetcher = vi.fn<Fetcher<City>>(async () => cities);
    const ta = new Typeahead<City>(makeInput(), {
      source: fetcher,
      displayField: 'name',
      minLength: 3,
      debounceMs: 50,
    });

    ta.setQuery('to');
    vi.advanceTimersByTime(100);

    expect(fetcher).not.toHaveBeenCalled();
    expect(ta.isOpen).toBe(false);
  });

  it('aborts the in-flight request when a new query arrives', async () => {
    const first = deferred<City[]>();
    const seen: AbortSignal[] = [];
    const fetcher: Fetcher<City> = (q, signal) => {
      seen.push(signal);
      return q === 'a' ? first.promise : Promise.resolve(cities);
    };

    const ta = new Typeahead<City>(makeInput(), {
      source: fetcher,
      displayField: 'name',
      debounceMs: 50,
    });

    ta.setQuery('a');
    vi.advanceTimersByTime(50);
    expect(seen).toHaveLength(1);
    expect(seen[0]?.aborted).toBe(false);

    ta.setQuery('ab');
    vi.advanceTimersByTime(50);

    expect(seen[0]?.aborted).toBe(true);
    expect(seen).toHaveLength(2);

    // Resolving the aborted request should be a no-op.
    first.resolve([{ id: 99, name: 'Stale' }]);
    await vi.runAllTimersAsync();

    expect(ta.items.find((it) => it.name === 'Stale')).toBeUndefined();
  });

  it('emits an error event when the fetcher rejects', async () => {
    const fetcher: Fetcher<City> = () => Promise.reject(new Error('network'));
    const ta = new Typeahead<City>(makeInput(), {
      source: fetcher,
      displayField: 'name',
      debounceMs: 10,
    });
    const onError = vi.fn();
    ta.on('error', (e) => onError(e.detail));

    ta.setQuery('to');
    vi.advanceTimersByTime(10);
    await vi.runAllTimersAsync();

    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0]?.[0].error).toBeInstanceOf(Error);
  });

  it('toggles data-loading on the input during a request', async () => {
    const d = deferred<City[]>();
    const ta = new Typeahead<City>(makeInput(), {
      source: () => d.promise,
      displayField: 'name',
      debounceMs: 10,
    });

    ta.setQuery('to');
    vi.advanceTimersByTime(10);
    expect(ta.input.dataset.loading).toBe('true');

    d.resolve(cities);
    await vi.runAllTimersAsync();
    expect(ta.input.dataset.loading).toBeUndefined();
  });

  it('destroy aborts the in-flight request and clears loading state', async () => {
    const d = deferred<City[]>();
    let captured: AbortSignal | undefined;
    const ta = new Typeahead<City>(makeInput(), {
      source: (_q, signal) => {
        captured = signal;
        return d.promise;
      },
      displayField: 'name',
      debounceMs: 10,
    });

    ta.setQuery('to');
    vi.advanceTimersByTime(10);
    expect(ta.input.dataset.loading).toBe('true');
    expect(captured?.aborted).toBe(false);

    ta.destroy();

    expect(captured?.aborted).toBe(true);
    // Loading hint was cleared as part of teardown.
    expect(document.querySelector('[data-loading]')).toBeNull();
  });

  it('setSource aborts the running request from the previous source', async () => {
    let captured: AbortSignal | undefined;
    const d = deferred<City[]>();
    const ta = new Typeahead<City>(makeInput(), {
      source: (_q, signal) => {
        captured = signal;
        return d.promise;
      },
      displayField: 'name',
      debounceMs: 10,
    });

    ta.setQuery('to');
    vi.advanceTimersByTime(10);

    ta.setSource(cities);

    expect(captured?.aborted).toBe(true);
  });

  it('rebuilds the debounce window when setOptions changes debounceMs', () => {
    const fetcher = vi.fn<Fetcher<City>>(async () => cities);
    const ta = new Typeahead<City>(makeInput(), {
      source: fetcher,
      displayField: 'name',
      debounceMs: 200,
    });

    ta.setOptions({ debounceMs: 50 });
    ta.setQuery('to');

    vi.advanceTimersByTime(50);
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
