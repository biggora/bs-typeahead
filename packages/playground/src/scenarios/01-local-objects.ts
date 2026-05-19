import { Typeahead } from '@bs-typeahead/core';
import { allCities, type City } from '../mock-server.js';
import { scenarioFrame } from '../helpers.js';

const CODE = `import { Typeahead } from '@bs-typeahead/core';

const ta = new Typeahead<City>(input, {
  source: allCities,
  displayField: 'name',
  valueField: 'id',
});

ta.on('select', (e) => console.log(e.detail));`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(container, 'Demo #1 — Local array of objects', CODE);
  const ta = new Typeahead<City>(frame.input, {
    source: allCities,
    displayField: 'name',
    valueField: 'id',
  });
  const off = ta.on('select', (e) => {
    frame.showSelection(`Selected #${e.detail.value as number}: ${e.detail.item.name}`);
  });
  return (): void => {
    off();
    ta.destroy();
  };
}
