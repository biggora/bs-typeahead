import { describe, expect, it } from 'vitest';
import { highlightToNodes } from '../src/highlight.js';

function render(nodes: Node[]): string {
  const wrapper = document.createElement('div');
  wrapper.append(...nodes);
  return wrapper.innerHTML;
}

describe('highlightToNodes', () => {
  it('returns a single text node when query is empty', () => {
    const nodes = highlightToNodes('Toronto', '');
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(nodes[0]?.textContent).toBe('Toronto');
  });

  it('wraps query matches in <mark> while leaving the rest as text nodes', () => {
    const nodes = highlightToNodes('Toronto', 'to');
    expect(render(nodes)).toBe('<mark>To</mark>ron<mark>to</mark>');
  });

  it('treats HTML-like text as literal content, never markup (XSS-safe)', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const wrapper = document.createElement('div');
    wrapper.append(...highlightToNodes(malicious, 'img'));

    // Critical: no <img> element was actually created.
    expect(wrapper.querySelector('img')).toBeNull();
    // The <mark> wraps the matched substring as a real element.
    const marks = wrapper.querySelectorAll('mark');
    expect(marks.length).toBe(1);
    expect(marks[0]?.textContent).toBe('img');
    // Reading the visible text round-trips back to the original string.
    expect(wrapper.textContent).toBe(malicious);
  });

  it('handles a query containing regex metacharacters without throwing', () => {
    expect(render(highlightToNodes('1+1=2', '+'))).toBe('1<mark>+</mark>1=2');
  });

  it('does not loop forever on edge regex patterns', () => {
    expect(() => highlightToNodes('abc', '')).not.toThrow();
    expect(() => highlightToNodes('', 'q')).not.toThrow();
  });
});
