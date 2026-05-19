/** Minimal `createElement` shorthand to avoid innerHTML throughout scenarios. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<{ class: string; id: string; type: string; placeholder: string }> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs.class) node.className = attrs.class;
  if (attrs.id) node.id = attrs.id;
  if ('type' in attrs && attrs.type !== undefined && 'type' in node) {
    (node as HTMLInputElement).type = attrs.type;
  }
  if ('placeholder' in attrs && attrs.placeholder !== undefined) {
    node.setAttribute('placeholder', attrs.placeholder);
  }
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export interface ScenarioFrame {
  input: HTMLInputElement;
  output: HTMLDivElement;
  showSelection: (text: string) => void;
}

/**
 * Builds a consistent scaffold (title, input column, code sample column,
 * status output box) for every scenario. Returns the input and the output
 * element so the scenario can wire its own typeahead.
 */
export function scenarioFrame(
  container: HTMLElement,
  title: string,
  code: string,
  options: { placeholder?: string; inputType?: string } = {},
): ScenarioFrame {
  const h2 = el('h2', {}, [title]);

  const input = el('input', {
    class: 'form-control',
    type: options.inputType ?? 'text',
    placeholder: options.placeholder ?? 'Search cities...',
  });

  const inputCol = el('div', { class: 'col-md-5' }, [input]);

  const pre = el('pre', { class: 'code-sample' });
  pre.append(document.createTextNode(code));
  const codeCol = el('div', { class: 'col-md-7' }, [pre]);

  const output = el('div', { class: 'scenario-output' });

  const row = el('div', { class: 'row g-3 align-items-start' }, [inputCol, codeCol]);

  container.append(h2, row, output);

  return {
    input,
    output,
    showSelection(text): void {
      output.textContent = text;
      output.classList.add('visible');
    },
  };
}
