import { Typeahead } from '@bs-typeahead/core';
import { scenarioFrame } from '../helpers.js';

interface CityUpper {
  ID: number;
  Name: string;
}

const data: CityUpper[] = [
  { ID: 1, Name: 'Toronto' },
  { ID: 2, Name: 'Montreal' },
  { ID: 3, Name: 'New York' },
  { ID: 4, Name: 'Buffalo' },
  { ID: 5, Name: 'Boston' },
];

const CODE = `// Override which fields drive matching and which one becomes the value.
new Typeahead<CityUpper>(input, {
  source: data,
  displayField: 'Name',
  valueField: 'ID',
});`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(container, 'Demo #2 — Custom field names', CODE);
  const ta = new Typeahead<CityUpper>(frame.input, {
    source: data,
    displayField: 'Name',
    valueField: 'ID',
  });
  const off = ta.on('select', (e) => {
    frame.showSelection(`Selected #${e.detail.value as number}: ${e.detail.item.Name}`);
  });
  return (): void => {
    off();
    ta.destroy();
  };
}
