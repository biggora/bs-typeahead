import {
  applyComboboxAttrs,
  createAria,
  removeAriaAttrs,
  setActiveDescendant,
  setExpanded,
  type AriaBinding,
} from './aria.js';
import { debounce, type DebouncedFn } from './debounce.js';
import { attachFloating, type FloatingController } from './floating.js';
import { highlightToNodes } from './highlight.js';
import { defaultMatcher, getDisplay, sortMatches } from './matcher.js';
import type {
  ClassNamesConfig,
  RenderContext,
  TypeaheadEventDetail,
  TypeaheadItem,
  TypeaheadOptions,
} from './types.js';

const DEFAULT_CLASSNAMES: ClassNamesConfig = {
  menu: 'dropdown-menu',
  item: 'dropdown-item',
  active: 'active',
  shown: 'show',
};

const DEFAULTS = {
  minLength: 1,
  debounceMs: 300,
  maxItems: 10,
  autoSelect: true,
  highlight: true,
  matchWidth: true,
  placement: 'bottom-start',
} as const;

/**
 * Framework-agnostic typeahead with a fully imperative API. Designed so that
 * a thin wrapper (React, Vue, Solid) can keep the input as the source of
 * truth while routing all interaction through `setOptions`, `setQuery`,
 * `open`, `close`, `destroy` and the typed events.
 *
 * Phase 2 covers menu rendering, keyboard/mouse interaction, Floating UI
 * positioning and the WAI-ARIA 1.2 Combobox pattern. Async sources land in
 * Phase 3.
 */
export class Typeahead<T extends TypeaheadItem = TypeaheadItem> extends EventTarget {
  readonly input: HTMLInputElement;
  protected options: TypeaheadOptions<T>;
  private _query = '';
  private _items: readonly T[] = [];
  private _isOpen = false;
  private _activeIndex = -1;
  private _destroyed = false;

  private readonly menu: HTMLUListElement;
  private readonly aria: AriaBinding;
  private optionEls: HTMLElement[] = [];
  private floating: FloatingController | null = null;
  private hoveringMenu = false;

  private inflight: AbortController | null = null;
  private debouncedRunFetch: DebouncedFn<(query: string) => void>;
  private debounceWindow: number;

  private readonly onInputInput: (e: Event) => void;
  private readonly onInputFocus: () => void;
  private readonly onInputBlur: () => void;
  private readonly onInputKeydown: (e: KeyboardEvent) => void;
  private readonly onMenuMousedown: (e: MouseEvent) => void;
  private readonly onMenuClick: (e: MouseEvent) => void;
  private readonly onMenuMouseover: (e: MouseEvent) => void;
  private readonly onMenuMouseleave: () => void;

  constructor(input: HTMLInputElement, options: TypeaheadOptions<T>) {
    super();
    this.input = input;
    this.options = { ...options };

    this.aria = createAria();
    this.debounceWindow = this.options.debounceMs ?? DEFAULTS.debounceMs;
    this.debouncedRunFetch = debounce((q: string) => this.runFetch(q), this.debounceWindow);
    this.menu = document.createElement('ul');
    this.menu.id = this.aria.menuId;
    this.menu.setAttribute('role', 'listbox');
    this.menu.setAttribute('tabindex', '-1');
    this.menu.dataset.open = 'false';
    this.applyMenuClasses();
    this.menu.style.display = 'none';
    document.body.append(this.menu);

    applyComboboxAttrs(this.input, this.aria.menuId);

    this.onInputInput = (e): void => {
      const value = (e.target as HTMLInputElement).value;
      this.setQuery(value);
    };
    this.onInputFocus = (): void => {
      if (this._items.length > 0) this.open();
    };
    this.onInputBlur = (): void => {
      if (!this.hoveringMenu) this.close();
    };
    this.onInputKeydown = (e): void => this.handleKeydown(e);
    this.onMenuMousedown = (e): void => {
      // Prevent the input from blurring before the click handler runs.
      e.preventDefault();
    };
    this.onMenuClick = (e): void => {
      const li = (e.target as Element | null)?.closest<HTMLElement>('[role="option"]');
      if (!li) return;
      const idx = this.optionEls.indexOf(li);
      if (idx >= 0) {
        this._activeIndex = idx;
        this.select();
        this.input.focus();
      }
    };
    this.onMenuMouseover = (e): void => {
      const li = (e.target as Element | null)?.closest<HTMLElement>('[role="option"]');
      if (!li) return;
      const idx = this.optionEls.indexOf(li);
      if (idx >= 0) this.setActive(idx);
      this.hoveringMenu = true;
    };
    this.onMenuMouseleave = (): void => {
      this.hoveringMenu = false;
    };

    this.input.addEventListener('input', this.onInputInput);
    this.input.addEventListener('focus', this.onInputFocus);
    this.input.addEventListener('blur', this.onInputBlur);
    this.input.addEventListener('keydown', this.onInputKeydown);
    this.menu.addEventListener('mousedown', this.onMenuMousedown);
    this.menu.addEventListener('click', this.onMenuClick);
    this.menu.addEventListener('mouseover', this.onMenuMouseover);
    this.menu.addEventListener('mouseleave', this.onMenuMouseleave);
  }

  get query(): string {
    return this._query;
  }

  get items(): readonly T[] {
    return this._items;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  get activeIndex(): number {
    return this._activeIndex;
  }

  setOptions(partial: Partial<TypeaheadOptions<T>>): void {
    const prevClassNames = this.options.classNames;
    this.options = { ...this.options, ...partial };
    if (partial.classNames && partial.classNames !== prevClassNames) {
      this.applyMenuClasses();
    }
    if (partial.debounceMs !== undefined && partial.debounceMs !== this.debounceWindow) {
      this.debouncedRunFetch.cancel();
      this.debounceWindow = partial.debounceMs;
      this.debouncedRunFetch = debounce((q: string) => this.runFetch(q), this.debounceWindow);
    }
  }

  setSource(source: TypeaheadOptions<T>['source']): void {
    this.abortInflight();
    this.debouncedRunFetch.cancel();
    this.options.source = source;
  }

  setQuery(query: string, opts?: { silent?: boolean }): void {
    if (query === this._query) return;
    this._query = query;
    if (this.input.value !== query) this.input.value = query;
    if (!opts?.silent) {
      this.emit('query', { query });
      this.lookup();
    }
  }

  open(): void {
    if (this._isOpen || this._destroyed) return;
    this._isOpen = true;
    this.menu.style.display = 'block';
    this.menu.dataset.open = 'true';
    this.menu.classList.add(this.resolvedClassNames().shown);
    setExpanded(this.input, true);
    this.floating = attachFloating(this.input, this.menu, {
      placement: this.options.placement ?? DEFAULTS.placement,
      matchWidth: this.options.matchWidth ?? DEFAULTS.matchWidth,
      maxHeight: this.options.maxHeight,
    });
    this.updateActiveDescendant();
    this.emit('open', undefined);
  }

  close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this.menu.style.display = 'none';
    this.menu.dataset.open = 'false';
    this.menu.classList.remove(this.resolvedClassNames().shown);
    setExpanded(this.input, false);
    setActiveDescendant(this.input, null);
    this.floating?.destroy();
    this.floating = null;
    this.emit('close', undefined);
  }

  /**
   * Commits the currently active option. Returns true if a selection was made.
   */
  select(): boolean {
    const idx = this._activeIndex;
    if (idx < 0 || idx >= this._items.length) return false;
    const item = this._items[idx];
    if (item === undefined) return false;
    const display = getDisplay(item, this.options.displayField);
    const value = this.resolveValue(item);
    this.setQuery(display, { silent: true });
    // Clear items so a subsequent focus doesn't re-open the menu with stale
    // suggestions. New input events will re-trigger lookup() naturally.
    this._items = [];
    this._activeIndex = -1;
    this.optionEls = [];
    this.menu.replaceChildren();
    this.close();
    this.emit('select', { item, value, index: idx });
    return true;
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.abortInflight();
    this.debouncedRunFetch.cancel();
    this.close();
    this.input.removeEventListener('input', this.onInputInput);
    this.input.removeEventListener('focus', this.onInputFocus);
    this.input.removeEventListener('blur', this.onInputBlur);
    this.input.removeEventListener('keydown', this.onInputKeydown);
    this.menu.removeEventListener('mousedown', this.onMenuMousedown);
    this.menu.removeEventListener('click', this.onMenuClick);
    this.menu.removeEventListener('mouseover', this.onMenuMouseover);
    this.menu.removeEventListener('mouseleave', this.onMenuMouseleave);
    removeAriaAttrs(this.input);
    this.menu.remove();
    this.optionEls = [];
  }

  /**
   * Runs a lookup against the current source. Synchronous for arrays;
   * debounced and AbortController-aware for async fetchers.
   */
  lookup(): void {
    const query = this._query;
    const source = this.options.source;

    if (typeof source === 'function') {
      this.abortInflight();
      this.debouncedRunFetch.cancel();
      if (query.length < this.getMinLength()) {
        this._items = [];
        this._activeIndex = -1;
        this.optionEls = [];
        this.menu.replaceChildren();
        this.setLoading(false);
        this.emit('load', { items: [], query });
        this.close();
        return;
      }
      this.debouncedRunFetch(query);
      return;
    }

    if (query.length < this.getMinLength()) {
      this._items = [];
      this._activeIndex = -1;
      this.optionEls = [];
      this.menu.replaceChildren();
      this.emit('load', { items: [], query });
      this.close();
      return;
    }

    const matcher = this.options.matcher ?? defaultMatcher;
    const displayField = this.options.displayField;
    const filtered: T[] = [];
    const filteredDisplays: string[] = [];
    for (let i = 0; i < source.length; i++) {
      const item = source[i];
      if (item === undefined) continue;
      const display = getDisplay(item, displayField);
      if (matcher(item, query, display)) {
        filtered.push(item);
        filteredDisplays.push(display);
      }
    }
    const sorted = sortMatches(filtered, query, filteredDisplays);
    this.commitItems(sorted.slice(0, this.getMaxItems()));
  }

  private runFetch(query: string): void {
    const source = this.options.source;
    if (typeof source !== 'function') return;
    if (query !== this._query) return; // The user moved on; drop stale work.
    const controller = new AbortController();
    this.inflight = controller;
    this.setLoading(true);
    source(query, controller.signal).then(
      (items) => {
        if (controller.signal.aborted || controller !== this.inflight) return;
        this.inflight = null;
        this.setLoading(false);
        this.commitItems(items.slice(0, this.getMaxItems()));
      },
      (err: unknown) => {
        if (controller.signal.aborted || controller !== this.inflight) return;
        this.inflight = null;
        this.setLoading(false);
        this.emit('error', { error: err });
      },
    );
  }

  private abortInflight(): void {
    if (this.inflight) {
      this.inflight.abort();
      this.inflight = null;
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean): void {
    if (loading) this.input.dataset.loading = 'true';
    else delete this.input.dataset.loading;
  }

  /** Subscribe to a typed event; returns the unsubscribe function. */
  on<K extends keyof TypeaheadEventDetail<T>>(
    type: K,
    listener: (ev: CustomEvent<TypeaheadEventDetail<T>[K]>) => void,
  ): () => void {
    const handler = listener as EventListener;
    this.addEventListener(type, handler);
    return () => this.removeEventListener(type, handler);
  }

  resolvedClassNames(): ClassNamesConfig {
    return { ...DEFAULT_CLASSNAMES, ...this.options.classNames };
  }

  protected commitItems(items: readonly T[]): void {
    this._items = items;
    this._activeIndex = items.length > 0 && this.getAutoSelect() ? 0 : -1;
    this.render();
    this.emit('load', { items: [...items], query: this._query });

    if (items.length === 0) {
      const emptyRenderer = this.options.renderEmpty;
      if (emptyRenderer) {
        const node = emptyRenderer(this._query);
        if (node) {
          this.menu.replaceChildren(node);
          this.open();
          return;
        }
      }
      this.close();
      return;
    }
    this.open();
  }

  protected getMinLength(): number {
    return this.options.minLength ?? DEFAULTS.minLength;
  }

  protected getMaxItems(): number {
    return this.options.maxItems ?? DEFAULTS.maxItems;
  }

  protected getAutoSelect(): boolean {
    return this.options.autoSelect ?? DEFAULTS.autoSelect;
  }

  protected emit<K extends keyof TypeaheadEventDetail<T>>(
    type: K,
    detail: TypeaheadEventDetail<T>[K],
  ): void {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  private render(): void {
    const cn = this.resolvedClassNames();
    const items = this._items;
    const useHighlight = this.options.highlight ?? DEFAULTS.highlight;
    const customRender = this.options.renderItem;
    const frag = document.createDocumentFragment();
    const nextEls: HTMLElement[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item === undefined) continue;
      const display = getDisplay(item, this.options.displayField);
      const isActive = i === this._activeIndex;
      const ctx: RenderContext<T> = {
        index: i,
        query: this._query,
        display,
        isActive,
        classNames: cn,
        item,
      };
      const el = customRender ? customRender(item, ctx) : defaultRenderItem(ctx, useHighlight);
      el.setAttribute('role', 'option');
      el.id = this.aria.optionId(i);
      el.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) el.classList.add(cn.active);
      nextEls.push(el);
      frag.append(el);
    }

    this.optionEls = nextEls;
    this.menu.replaceChildren(frag);
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (!this._isOpen) {
      if (e.key === 'ArrowDown' && this._items.length > 0) {
        e.preventDefault();
        this.open();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.setActive(
          this._activeIndex < this._items.length - 1
            ? this._activeIndex + 1
            : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.setActive(
          this._activeIndex <= 0 ? this._items.length - 1 : this._activeIndex - 1,
        );
        break;
      case 'Home':
        e.preventDefault();
        this.setActive(0);
        break;
      case 'End':
        e.preventDefault();
        this.setActive(this._items.length - 1);
        break;
      case 'Enter':
        if (this._activeIndex >= 0) {
          e.preventDefault();
          this.select();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'Tab':
        if (this._activeIndex >= 0 && this.getAutoSelect()) {
          this.select();
        }
        break;
    }
  }

  private setActive(idx: number): void {
    if (idx === this._activeIndex || idx < 0 || idx >= this._items.length) return;
    const cn = this.resolvedClassNames();
    const prev = this.optionEls[this._activeIndex];
    const next = this.optionEls[idx];
    if (prev) {
      prev.classList.remove(cn.active);
      prev.setAttribute('aria-selected', 'false');
    }
    if (next) {
      next.classList.add(cn.active);
      next.setAttribute('aria-selected', 'true');
      next.scrollIntoView({ block: 'nearest' });
    }
    this._activeIndex = idx;
    this.updateActiveDescendant();
  }

  private updateActiveDescendant(): void {
    setActiveDescendant(
      this.input,
      this._activeIndex < 0 ? null : this.aria.optionId(this._activeIndex),
    );
  }

  private applyMenuClasses(): void {
    const cn = this.resolvedClassNames();
    this.menu.className = `typeahead-menu ${cn.menu}`;
  }

  private resolveValue(item: T): unknown {
    if (typeof item === 'string') return item;
    const field = this.options.valueField;
    if (field === undefined) return undefined;
    return (item as Record<string, unknown>)[field as string];
  }
}

function defaultRenderItem<T extends TypeaheadItem>(
  ctx: RenderContext<T>,
  highlight: boolean,
): HTMLElement {
  const li = document.createElement('li');
  li.className = ctx.classNames.item;
  if (highlight && ctx.query) {
    li.replaceChildren(...highlightToNodes(ctx.display, ctx.query));
  } else {
    li.textContent = ctx.display;
  }
  return li;
}
