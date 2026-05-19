const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_SPECIAL = /[&<>"']/g;
const REGEX_SPECIAL = /[.*+?^${}()|[\]\\-]/g;

export function escapeHtml(input: string): string {
  return input.replace(HTML_SPECIAL, (ch) => ESCAPE_MAP[ch] ?? ch);
}

export function escapeRegExp(input: string): string {
  return input.replace(REGEX_SPECIAL, '\\$&');
}

/**
 * Returns an HTML-safe string where case-insensitive occurrences of `query`
 * are wrapped in `<mark>`. The text is HTML-escaped first, so user-controlled
 * values cannot inject markup.
 */
export function highlightText(text: string, query: string): string {
  const escapedText = escapeHtml(text);
  if (!query) return escapedText;
  const escapedQuery = escapeHtml(query);
  const pattern = new RegExp(`(${escapeRegExp(escapedQuery)})`, 'gi');
  return escapedText.replace(pattern, '<mark>$1</mark>');
}

/**
 * DOM-safe equivalent of `highlightText`: returns an array of text and
 * `<mark>` element nodes instead of an HTML string. Avoids any innerHTML
 * pathway so renderers cannot accidentally introduce XSS.
 */
export function highlightToNodes(text: string, query: string): Node[] {
  if (!query) return [document.createTextNode(text)];
  const pattern = new RegExp(escapeRegExp(query), 'gi');
  const nodes: Node[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    if (start > lastIndex) {
      nodes.push(document.createTextNode(text.slice(lastIndex, start)));
    }
    const mark = document.createElement('mark');
    mark.textContent = match[0];
    nodes.push(mark);
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(document.createTextNode(text.slice(lastIndex)));
  }
  return nodes;
}
