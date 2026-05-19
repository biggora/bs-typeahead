let counter = 0;

export function uniqueId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export interface AriaBinding {
  menuId: string;
  optionId(index: number): string;
}

export function createAria(): AriaBinding {
  const menuId = uniqueId('typeahead-menu');
  return {
    menuId,
    optionId: (index): string => `${menuId}-opt-${index}`,
  };
}

const ARIA_ATTRS = [
  'role',
  'aria-autocomplete',
  'aria-expanded',
  'aria-controls',
  'aria-activedescendant',
] as const;

/**
 * Applies the WAI-ARIA 1.2 Combobox pattern (list-autocomplete variant)
 * attributes to the input element.
 */
export function applyComboboxAttrs(input: HTMLInputElement, menuId: string): void {
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', menuId);
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
}

export function setExpanded(input: HTMLInputElement, expanded: boolean): void {
  input.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

export function setActiveDescendant(
  input: HTMLInputElement,
  optionId: string | null,
): void {
  if (optionId !== null) {
    input.setAttribute('aria-activedescendant', optionId);
  } else {
    input.removeAttribute('aria-activedescendant');
  }
}

export function removeAriaAttrs(input: HTMLInputElement): void {
  for (const attr of ARIA_ATTRS) {
    input.removeAttribute(attr);
  }
  input.removeAttribute('autocomplete');
  input.removeAttribute('spellcheck');
}
