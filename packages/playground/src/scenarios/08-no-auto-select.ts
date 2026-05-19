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
];

const CODE = `// With autoSelect=false, Enter is a no-op until the user explicitly
// highlights an option with ArrowDown/ArrowUp.
new Typeahead<CityUpper>(input, {
  source: data,
  displayField: 'Name',
  valueField: 'ID',
  autoSelect: false,
});`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(container, 'Demo #8 — autoSelect: false', CODE);
  const ta = new Typeahead<CityUpper>(frame.input, {
    source: data,
    displayField: 'Name',
    valueField: 'ID',
    autoSelect: false,
  });
  const off = ta.on('select', (e) => {
    frame.showSelection(`Selected #${e.detail.value as number}: ${e.detail.item.Name}`);
  });
  return (): void => {
    off();
    ta.destroy();
  };
}
