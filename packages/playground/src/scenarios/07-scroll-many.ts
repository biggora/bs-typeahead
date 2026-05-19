import { Typeahead } from '@bs-typeahead/core';
import { scenarioFrame } from '../helpers.js';

const data = [
  'Toronto',
  'Toronto1',
  'Toronto2',
  'Toronto3',
  'Toronto4',
  'Toronto5',
  'Toronto6',
  'Toronto7',
  'Toronto8',
  'Toronto9',
  'Toronto10',
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

const CODE = `// The old "scrollBar: true" hack is replaced with explicit maxHeight + maxItems.
new Typeahead<string>(input, {
  source: data,
  maxItems: 100,
  maxHeight: 220,
});`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(container, 'Demo #7 — Long list with maxHeight scroll', CODE);
  const ta = new Typeahead<string>(frame.input, {
    source: data,
    maxItems: 100,
    maxHeight: 220,
  });
  const off = ta.on('select', (e) => {
    frame.showSelection(`Selected: ${e.detail.item}`);
  });
  return (): void => {
    off();
    ta.destroy();
  };
}
