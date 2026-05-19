import { Typeahead } from '@bs-typeahead/core';
import { mockFetcher, type City } from '../mock-server.js';
import { scenarioFrame } from '../helpers.js';

const CODE = `// Tune the wait window (debounceMs) and the trigger length (minLength).
// HTTP method, headers, request body — all live inside your fetcher.
new Typeahead<City>(input, {
  source: async (query, signal) => {
    const res = await fetch('/cities/list', {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: query }),
    });
    return res.json();
  },
  displayField: 'name',
  minLength: 1,
  debounceMs: 200,
});`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(container, 'Demo #5 — Async + debounce + minLength', CODE);
  const ta = new Typeahead<City>(frame.input, {
    source: mockFetcher(400),
    displayField: 'name',
    valueField: 'id',
    minLength: 1,
    debounceMs: 200,
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
