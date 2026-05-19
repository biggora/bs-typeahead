import type { Fetcher } from '@bs-typeahead/core';

export interface City {
  id: number;
  name: string;
}

export const allCities: City[] = [
  { id: 1, name: 'Toronto' },
  { id: 2, name: 'Montreal' },
  { id: 3, name: 'New York' },
  { id: 4, name: 'Buffalo' },
  { id: 5, name: 'Boston' },
  { id: 6, name: 'Columbus' },
  { id: 7, name: 'Dallas' },
  { id: 8, name: 'Vancouver' },
  { id: 9, name: 'Seattle' },
  { id: 10, name: 'Los Angeles' },
];

/**
 * Returns a fetcher that simulates a network round-trip and honors AbortSignal.
 * Use this in fetcher-based scenarios to demonstrate debounce, cancellation
 * and loading state without spinning up an HTTP server.
 */
export function mockFetcher(delayMs = 250): Fetcher<City> {
  return (query, signal) =>
    new Promise<City[]>((resolve, reject) => {
      const id = setTimeout(() => {
        const q = query.toLowerCase();
        resolve(allCities.filter((c) => c.name.toLowerCase().includes(q)));
      }, delayMs);
      signal.addEventListener('abort', () => {
        clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
}
