import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyComboboxAttrs,
  removeAriaAttrs,
  setActiveDescendant,
  setExpanded,
  uniqueId,
} from '../src/aria.js';

function makeInput(): HTMLInputElement {
  return document.createElement('input');
}

describe('uniqueId', () => {
  it('returns a different id on every call', () => {
    const a = uniqueId('x');
    const b = uniqueId('x');
    expect(a).not.toBe(b);
  });

  it('uses the supplied prefix', () => {
    expect(uniqueId('typeahead-menu')).toMatch(/^typeahead-menu-\d+$/);
  });
});

describe('applyComboboxAttrs', () => {
  let input: HTMLInputElement;
  beforeEach(() => {
    input = makeInput();
  });

  it('applies the WAI-ARIA Combobox 1.2 attributes', () => {
    applyComboboxAttrs(input, 'menu-1');
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-controls')).toBe('menu-1');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.getAttribute('spellcheck')).toBe('false');
  });
});

describe('setExpanded', () => {
  it('reflects the expanded state', () => {
    const input = makeInput();
    setExpanded(input, true);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    setExpanded(input, false);
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('setActiveDescendant', () => {
  it('sets the attribute when given an id', () => {
    const input = makeInput();
    setActiveDescendant(input, 'opt-3');
    expect(input.getAttribute('aria-activedescendant')).toBe('opt-3');
  });

  it('removes the attribute when given null', () => {
    const input = makeInput();
    setActiveDescendant(input, 'opt-3');
    setActiveDescendant(input, null);
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  });
});

describe('removeAriaAttrs', () => {
  it('clears every attribute the plugin applied', () => {
    const input = makeInput();
    applyComboboxAttrs(input, 'menu-1');
    setActiveDescendant(input, 'opt-1');

    removeAriaAttrs(input);

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
});
