import { describe, expect, it } from 'vitest';
import { escapeHtml, escapeRegExp, highlightText } from '../src/highlight.js';

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    );
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('passes regular text through unchanged', () => {
    expect(escapeHtml('Toronto')).toBe('Toronto');
  });
});

describe('escapeRegExp', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegExp('a.b*c?')).toBe('a\\.b\\*c\\?');
    expect(escapeRegExp('(group)')).toBe('\\(group\\)');
    expect(escapeRegExp('a-b')).toBe('a\\-b');
  });
});

describe('highlightText', () => {
  it('wraps query matches in <mark>', () => {
    expect(highlightText('Toronto', 'to')).toBe('<mark>To</mark>ron<mark>to</mark>');
  });

  it('is case-insensitive', () => {
    expect(highlightText('Toronto', 'TO')).toBe('<mark>To</mark>ron<mark>to</mark>');
  });

  it('HTML-escapes the source text before highlighting (XSS-safe)', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const out = highlightText(malicious, 'img');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;');
    expect(out).toContain('<mark>img</mark>');
  });

  it('returns escaped text when query is empty', () => {
    expect(highlightText('<b>', '')).toBe('&lt;b&gt;');
  });

  it('does not break when the query contains regex metacharacters', () => {
    expect(highlightText('1+1=2', '+')).toBe('1<mark>+</mark>1=2');
  });

  it('does not double-escape entities that match the query', () => {
    expect(highlightText('A&B', '&')).toBe('A<mark>&amp;</mark>B');
  });
});
