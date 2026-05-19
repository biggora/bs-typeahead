import type { DisplayField, TypeaheadItem } from './types.js';

export function getDisplay<T extends TypeaheadItem>(
  item: T,
  displayField: DisplayField<T> | undefined,
): string {
  if (typeof item === 'string') return item;
  if (typeof displayField === 'function') {
    return (displayField as (it: T) => string)(item);
  }
  const field = (displayField as keyof T | undefined) ?? ('name' as keyof T);
  const raw = (item as Record<string, unknown>)[field as string];
  return raw == null ? '' : String(raw);
}

export function defaultMatcher(
  _item: TypeaheadItem,
  query: string,
  display: string,
): boolean {
  if (!query) return true;
  return display.toLowerCase().includes(query.toLowerCase());
}

/**
 * Reorders matched items so prefix matches come first (case-insensitive),
 * then case-sensitive substring matches, then everything else.
 * Preserves original order within each bucket.
 */
export function sortMatches<T extends TypeaheadItem>(
  items: T[],
  query: string,
  displays: string[],
): T[] {
  if (!query) return [...items];
  const q = query.toLowerCase();
  const beginsWith: T[] = [];
  const caseSensitive: T[] = [];
  const caseInsensitive: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item === undefined) continue;
    const display = displays[i] ?? '';
    if (display.toLowerCase().startsWith(q)) {
      beginsWith.push(item);
    } else if (display.includes(query)) {
      caseSensitive.push(item);
    } else {
      caseInsensitive.push(item);
    }
  }

  return [...beginsWith, ...caseSensitive, ...caseInsensitive];
}
