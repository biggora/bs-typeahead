import { Typeahead } from '@bs-typeahead/core';
import { scenarioFrame } from '../helpers.js';

const data = [
  'Toronto',
  'Montreal',
  'New York',
  'Buffalo',
  'Boston',
  'Columbus',
  'Dallas',
  'Vancouver',
  'Seattle',
  'Los Angeles',
];

const CODE = `// Plain string source — no displayField needed.
new Typeahead<string>(input, { source: data });`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(container, 'Demo #6 — Array of strings', CODE);
  const ta = new Typeahead<string>(frame.input, { source: data });
  const off = ta.on('select', (e) => {
    frame.showSelection(`Selected: ${e.detail.item}`);
  });
  return (): void => {
    off();
    ta.destroy();
  };
}
