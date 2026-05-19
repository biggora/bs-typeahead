import { Typeahead } from '@bs-typeahead/core';
import { scenarioFrame } from '../helpers.js';

interface CityRich {
  id: number;
  full_name: string;
  first_two_letters: string;
}

const data: CityRich[] = [
  { id: 1, full_name: 'Toronto', first_two_letters: 'To' },
  { id: 2, full_name: 'Montreal', first_two_letters: 'Mo' },
  { id: 3, full_name: 'New York', first_two_letters: 'Ne' },
  { id: 4, full_name: 'Buffalo', first_two_letters: 'Bu' },
  { id: 5, full_name: 'Boston', first_two_letters: 'Bo' },
];

const CODE = `// displayField alone — id stays the default value field.
new Typeahead<CityRich>(input, {
  source: data,
  displayField: 'full_name',
});`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(container, 'Demo #3 — displayField only', CODE);
  const ta = new Typeahead<CityRich>(frame.input, {
    source: data,
    displayField: 'full_name',
    valueField: 'id',
  });
  const off = ta.on('select', (e) => {
    frame.showSelection(`Selected #${e.detail.value as number}: ${e.detail.item.full_name}`);
  });
  return (): void => {
    off();
    ta.destroy();
  };
}
