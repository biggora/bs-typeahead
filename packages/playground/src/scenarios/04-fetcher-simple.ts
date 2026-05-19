import { Typeahead } from '@bs-typeahead/core';
import { mockFetcher, type City } from '../mock-server.js';
import { scenarioFrame } from '../helpers.js';

const CODE = `// The old { ajax: '/cities/list' } shorthand is gone.
// Instead, pass any async (query, signal) => Promise<T[]> — fetch / axios /
// in-memory mock, doesn't matter to the core.
new Typeahead<City>(input, {
  source: async (query, signal) => {
    const res = await fetch('/cities/list?q=' + encodeURIComponent(query), { signal });
    return res.json();
  },
  displayField: 'name',
});`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(container, 'Demo #4 — Async fetcher', CODE);
  const ta = new Typeahead<City>(frame.input, {
    source: mockFetcher(250),
    displayField: 'name',
    valueField: 'id',
  });
  const offs = [
    ta.on('select', (e) => {
      frame.showSelection(`Selected #${e.detail.value as number}: ${e.detail.item.name}`);
    }),
    ta.on('error', (e) => {
      frame.showSelection(`Error: ${String(e.detail.error)}`);
    }),
  ];
  return (): void => {
    for (const off of offs) off();
    ta.destroy();
  };
}
