import { Typeahead } from '@bs-typeahead/core';
import { allCities, type City } from '../mock-server.js';
import { el, scenarioFrame } from '../helpers.js';

const CODE = `// Every option gets role="option" + a unique id, the input becomes
// role="combobox" with aria-controls / aria-activedescendant, and
// aria-expanded toggles with the menu. Screen readers announce
// "combobox, expanded, option 1 of 5 Toronto" out of the box.
new Typeahead<City>(input, {
  source: allCities,
  displayField: 'name',
  valueField: 'id',
});`;

export function init(container: HTMLElement): () => void {
  const frame = scenarioFrame(
    container,
    'Demo #10 — Accessibility (WAI-ARIA Combobox 1.2)',
    CODE,
  );

  const label = el('label', { class: 'form-label' }, ['Pick a city — try with a screen reader']);
  label.setAttribute('for', 'a11y-input');
  frame.input.id = 'a11y-input';
  frame.input.before(label);

  const ta = new Typeahead<City>(frame.input, {
    source: allCities,
    displayField: 'name',
    valueField: 'id',
  });

  const attrs = el('pre', { class: 'code-sample mt-3' });
  function refreshAttrs(): void {
    attrs.textContent = [
      `role=                    ${frame.input.getAttribute('role')}`,
      `aria-autocomplete=       ${frame.input.getAttribute('aria-autocomplete')}`,
      `aria-expanded=           ${frame.input.getAttribute('aria-expanded')}`,
      `aria-controls=           ${frame.input.getAttribute('aria-controls')}`,
      `aria-activedescendant=   ${frame.input.getAttribute('aria-activedescendant') ?? '(none)'}`,
    ].join('\n');
  }
  refreshAttrs();
  container.append(attrs);

  const offs = [
    ta.on('open', refreshAttrs),
    ta.on('close', refreshAttrs),
    ta.on('load', refreshAttrs),
    ta.on('select', (e) => {
      frame.showSelection(`Selected #${e.detail.value as number}: ${e.detail.item.name}`);
      refreshAttrs();
    }),
  ];
  frame.input.addEventListener('keydown', refreshAttrs);

  return (): void => {
    for (const off of offs) off();
    frame.input.removeEventListener('keydown', refreshAttrs);
    ta.destroy();
  };
}
