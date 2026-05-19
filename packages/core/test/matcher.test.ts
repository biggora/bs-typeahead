import { describe, expect, it } from 'vitest';
import { defaultMatcher, getDisplay, sortMatches } from '../src/matcher.js';

describe('getDisplay', () => {
  it('returns the string itself when item is a primitive', () => {
    expect(getDisplay('Toronto', undefined)).toBe('Toronto');
  });

  it('reads the named field from objects', () => {
    expect(getDisplay({ id: 1, name: 'Toronto' }, 'name')).toBe('Toronto');
  });

  it('defaults to the "name" field when displayField is omitted', () => {
    expect(getDisplay({ name: 'Toronto' }, undefined)).toBe('Toronto');
  });

  it('supports a function displayField', () => {
    const item = { a: 1, b: 2 };
    expect(getDisplay(item, (x) => `${x.a}/${x.b}`)).toBe('1/2');
  });

  it('returns empty string when the field is missing or null', () => {
    expect(getDisplay({} as Record<string, unknown>, 'name')).toBe('');
    expect(getDisplay({ name: null } as Record<string, unknown>, 'name')).toBe('');
  });

  it('stringifies non-string field values', () => {
    expect(getDisplay({ id: 42 } as Record<string, unknown>, 'id')).toBe('42');
  });
});

describe('defaultMatcher', () => {
  it('matches case-insensitively', () => {
    expect(defaultMatcher('x', 'to', 'Toronto')).toBe(true);
    expect(defaultMatcher('x', 'TO', 'Toronto')).toBe(true);
    expect(defaultMatcher('x', 'xyz', 'Toronto')).toBe(false);
  });

  it('matches everything when query is empty', () => {
    expect(defaultMatcher('x', '', 'anything')).toBe(true);
  });
});

describe('sortMatches', () => {
  it('puts prefix matches first (case-insensitive)', () => {
    const items = ['Boston', 'Toronto', 'Buffalo', 'Tokyo'];
    expect(sortMatches(items, 'to', items)).toEqual([
      'Toronto',
      'Tokyo',
      'Boston',
      'Buffalo',
    ]);
  });

  it('preserves order within each bucket', () => {
    const items = ['Aa', 'aA', 'Ab', 'AB'];
    expect(sortMatches(items, 'a', items)).toEqual(['Aa', 'aA', 'Ab', 'AB']);
  });

  it('returns items unchanged when query is empty', () => {
    expect(sortMatches(['a', 'b'], '', ['a', 'b'])).toEqual(['a', 'b']);
  });
});
