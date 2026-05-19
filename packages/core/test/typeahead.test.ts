import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Typeahead } from '../src/typeahead.js';

const cities = [
  { id: 1, name: 'Toronto' },
  { id: 2, name: 'Montreal' },
  { id: 3, name: 'New York' },
  { id: 4, name: 'Boston' },
  { id: 5, name: 'Tokyo' },
];

function makeInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.id = 't';
  document.body.append(input);
  return input;
}

describe('Typeahead — Phase 1 (local sync)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('filters items via setQuery and emits load with the filtered set', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    const loaded = vi.fn();
    ta.on('load', (e) => loaded(e.detail));

    ta.setQuery('to');

    expect(ta.items.length).toBeGreaterThan(0);
    expect(loaded).toHaveBeenCalledOnce();
    expect(ta.items[0]).toEqual({ id: 1, name: 'Toronto' });
  });

  it('emits empty load when query is shorter than minLength', () => {
    const ta = new Typeahead(makeInput(), {
      source: cities,
      displayField: 'name',
      minLength: 2,
    });
    const loaded = vi.fn();
    ta.on('load', (e) => loaded(e.detail));

    ta.setQuery('t');

    expect(ta.items).toEqual([]);
    expect(loaded).toHaveBeenCalledWith({ items: [], query: 't' });
  });

  it('caps results at maxItems', () => {
    const big = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `City${i}` }));
    const ta = new Typeahead(makeInput(), {
      source: big,
      displayField: 'name',
      maxItems: 3,
    });

    ta.setQuery('city');

    expect(ta.items.length).toBe(3);
  });

  it('emits a query event with the new query string', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    const queryFn = vi.fn();
    ta.on('query', (e) => queryFn(e.detail));

    ta.setQuery('to');

    expect(queryFn).toHaveBeenCalledWith({ query: 'to' });
  });

  it('setSource replaces the data source', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.setQuery('to');
    expect(ta.items.length).toBeGreaterThan(0);

    ta.setSource([{ id: 99, name: 'Atlantis' }]);
    ta.lookup();

    expect(ta.items).toEqual([]);
  });

  it('on() returns an unsubscribe function', () => {
    const ta = new Typeahead(makeInput(), { source: cities });
    const handler = vi.fn();
    const off = ta.on('load', handler);

    ta.setQuery('to');
    expect(handler).toHaveBeenCalledOnce();

    off();
    ta.setQuery('mo');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('open() and close() are idempotent and emit once per state transition', () => {
    const ta = new Typeahead(makeInput(), { source: cities });
    const onOpen = vi.fn();
    const onClose = vi.fn();
    ta.on('open', onOpen);
    ta.on('close', onClose);

    ta.open();
    ta.open();
    ta.close();
    ta.close();

    expect(onOpen).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('autoSelect=true picks index 0 after a successful lookup', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.setQuery('to');
    expect(ta.activeIndex).toBe(0);
  });

  it('autoSelect=false keeps activeIndex at -1', () => {
    const ta = new Typeahead(makeInput(), {
      source: cities,
      displayField: 'name',
      autoSelect: false,
    });
    ta.setQuery('to');
    expect(ta.activeIndex).toBe(-1);
  });
});
