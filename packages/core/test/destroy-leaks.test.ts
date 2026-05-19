import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Typeahead } from '../src/typeahead.js';

const cities = [
  { id: 1, name: 'Toronto' },
  { id: 2, name: 'Montreal' },
];

function makeInput(): HTMLInputElement {
  const input = document.createElement('input');
  document.body.append(input);
  return input;
}

function listboxCount(): number {
  return document.querySelectorAll('[role="listbox"]').length;
}

describe('Typeahead.destroy — StrictMode-safe cleanup', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('removes the menu element from the DOM', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    expect(listboxCount()).toBe(1);

    ta.destroy();

    expect(listboxCount()).toBe(0);
  });

  it('clears every ARIA attribute it previously set on the input', () => {
    const input = makeInput();
    const ta = new Typeahead(input, { source: cities, displayField: 'name' });
    ta.setQuery('to'); // opens menu, sets aria-expanded=true

    ta.destroy();

    for (const attr of [
      'role',
      'aria-autocomplete',
      'aria-expanded',
      'aria-controls',
      'aria-activedescendant',
      'autocomplete',
      'spellcheck',
    ]) {
      expect(input.hasAttribute(attr)).toBe(false);
    }
  });

  it('handles a React StrictMode-style double mount/unmount without leaking menus', () => {
    const input = makeInput();

    // Simulate StrictMode's create → cleanup → create cycle on a single host.
    const first = new Typeahead(input, { source: cities, displayField: 'name' });
    first.destroy();
    const second = new Typeahead(input, { source: cities, displayField: 'name' });

    expect(listboxCount()).toBe(1);

    second.destroy();
    expect(listboxCount()).toBe(0);
  });

  it('is idempotent — calling destroy twice is a no-op', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.destroy();
    expect(() => ta.destroy()).not.toThrow();
    expect(listboxCount()).toBe(0);
  });

  it('stops reacting to events on the input after destroy', () => {
    const input = makeInput();
    const ta = new Typeahead(input, { source: cities, displayField: 'name' });
    const onLoad = vi.fn();
    ta.on('load', onLoad);

    ta.destroy();

    input.value = 'to';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onLoad).not.toHaveBeenCalled();
  });
});
