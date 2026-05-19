import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Typeahead } from '../src/typeahead.js';

const cities = [
  { id: 1, name: 'Toronto' },
  { id: 2, name: 'Montreal' },
  { id: 3, name: 'New York' },
  { id: 4, name: 'Boston' },
  { id: 5, name: 'Tokyo' },
];

function makeInput(): HTMLInputElement {
  const input = document.createElement('input');
  document.body.append(input);
  return input;
}

function getMenu(): HTMLElement {
  const menu = document.querySelector('[role="listbox"]');
  if (!(menu instanceof HTMLElement)) throw new Error('listbox not found');
  return menu;
}

function getOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
}

describe('Typeahead — Phase 2 (UI)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('appends a hidden listbox to the body and wires ARIA on the input', () => {
    const input = makeInput();
    new Typeahead(input, { source: cities, displayField: 'name' });

    const menu = getMenu();
    expect(menu.style.display).toBe('none');
    expect(menu.getAttribute('role')).toBe('listbox');

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-controls')).toBe(menu.id);
  });

  it('renders options and opens the menu on a matching query', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.setQuery('to');

    const menu = getMenu();
    expect(menu.style.display).toBe('block');
    expect(ta.input.getAttribute('aria-expanded')).toBe('true');

    const options = getOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]?.textContent).toBe('Toronto');
  });

  it('marks the first option active under autoSelect=true', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.setQuery('to');

    const options = getOptions();
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');
    expect(options[0]?.classList.contains('active')).toBe(true);
    expect(ta.input.getAttribute('aria-activedescendant')).toBe(options[0]?.id);
  });

  it('ArrowDown moves to the next option and wraps around at the end', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.setQuery('to');

    const options = getOptions();
    ta.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[1]?.getAttribute('aria-selected')).toBe('true');

    ta.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    if (options.length === 2) {
      expect(options[0]?.getAttribute('aria-selected')).toBe('true');
    }
  });

  it('ArrowUp wraps from index 0 to the last option', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.setQuery('to');

    const options = getOptions();
    ta.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(options[options.length - 1]?.getAttribute('aria-selected')).toBe('true');
  });

  it('Enter on an active option emits select with item and resolved value', () => {
    const ta = new Typeahead(makeInput(), {
      source: cities,
      displayField: 'name',
      valueField: 'id',
    });
    ta.setQuery('to');
    const onSelect = vi.fn();
    ta.on('select', (e) => onSelect(e.detail));

    ta.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith({
      item: { id: 1, name: 'Toronto' },
      value: 1,
      index: 0,
    });
    expect(ta.input.value).toBe('Toronto');
    expect(ta.isOpen).toBe(false);
  });

  it('Escape closes the menu without emitting select', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.setQuery('to');
    const onSelect = vi.fn();
    ta.on('select', onSelect);

    ta.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(ta.isOpen).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clicking an option selects it and closes the menu', () => {
    const ta = new Typeahead(makeInput(), {
      source: cities,
      displayField: 'name',
      valueField: 'id',
    });
    ta.setQuery('to');
    const onSelect = vi.fn();
    ta.on('select', (e) => onSelect(e.detail));

    const options = getOptions();
    options[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ index: 1, value: 5 }),
    );
    expect(ta.isOpen).toBe(false);
  });

  it('mouseover changes the active option', () => {
    const ta = new Typeahead(makeInput(), { source: cities, displayField: 'name' });
    ta.setQuery('to');

    const options = getOptions();
    options[1]?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    expect(options[1]?.getAttribute('aria-selected')).toBe('true');
    expect(options[0]?.getAttribute('aria-selected')).toBe('false');
    expect(ta.activeIndex).toBe(1);
  });

  it('emits close and hides the menu when the query falls below minLength', () => {
    const ta = new Typeahead(makeInput(), {
      source: cities,
      displayField: 'name',
      minLength: 2,
    });
    ta.setQuery('to');
    expect(ta.isOpen).toBe(true);

    ta.setQuery('');
    expect(ta.isOpen).toBe(false);
    expect(getMenu().style.display).toBe('none');
  });

  it('uses renderEmpty when there are no matches', () => {
    const ta = new Typeahead(makeInput(), {
      source: cities,
      displayField: 'name',
      renderEmpty: (q) => {
        const el = document.createElement('li');
        el.textContent = `No results for "${q}"`;
        el.classList.add('empty-state');
        return el;
      },
    });
    ta.setQuery('zzzz');

    expect(ta.isOpen).toBe(true);
    const empty = document.querySelector('.empty-state');
    expect(empty?.textContent).toBe('No results for "zzzz"');
  });

  it('honors a custom renderItem while still setting required ARIA wiring', () => {
    const ta = new Typeahead<{ id: number; name: string }>(makeInput(), {
      source: cities,
      displayField: 'name',
      valueField: 'id',
      renderItem: (item, ctx) => {
        const el = document.createElement('li');
        el.textContent = `#${item.id} ${ctx.display}`;
        el.classList.add('custom-item');
        return el;
      },
    });
    ta.setQuery('to');

    const options = getOptions();
    expect(options[0]?.classList.contains('custom-item')).toBe(true);
    expect(options[0]?.textContent).toBe('#1 Toronto');
    expect(options[0]?.getAttribute('role')).toBe('option');
    expect(options[0]?.id).toBeTruthy();
  });

  it('Tab with an active option commits the selection when autoSelect is on', () => {
    const ta = new Typeahead(makeInput(), {
      source: cities,
      displayField: 'name',
      valueField: 'id',
    });
    ta.setQuery('to');
    const onSelect = vi.fn();
    ta.on('select', onSelect);

    ta.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(onSelect).toHaveBeenCalledOnce();
  });
});
