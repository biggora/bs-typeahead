export type TypeaheadItem = string | object;

export type Fetcher<T extends TypeaheadItem> = (
  query: string,
  signal: AbortSignal,
) => Promise<T[]>;

export type Source<T extends TypeaheadItem> = T[] | Fetcher<T>;

export type DisplayField<T extends TypeaheadItem> = T extends string
  ? never
  : keyof T | ((item: T) => string);

export type ValueField<T extends TypeaheadItem> = T extends string ? never : keyof T;

export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end';

export interface ClassNamesConfig {
  /** Class applied to the menu container. Defaults to Bootstrap 5 `dropdown-menu`. */
  menu: string;
  /** Class applied to each option element. Defaults to Bootstrap 5 `dropdown-item`. */
  item: string;
  /** Class applied to the active option. Defaults to Bootstrap 5 `active`. */
  active: string;
  /** Class added when the menu is shown. */
  shown: string;
}

export interface RenderContext<T extends TypeaheadItem> {
  index: number;
  query: string;
  display: string;
  isActive: boolean;
  classNames: ClassNamesConfig;
  item: T;
}

export interface TypeaheadOptions<T extends TypeaheadItem = TypeaheadItem> {
  /** Either a synchronous array or an async fetcher `(query, signal) => Promise<T[]>`. */
  source: Source<T>;
  displayField?: DisplayField<T>;
  valueField?: ValueField<T>;
  /** Minimum query length to trigger a lookup. Default: 1. */
  minLength?: number;
  /** Debounce window for async fetcher in ms. Default: 300. */
  debounceMs?: number;
  /** Maximum number of items to render. Default: 10. */
  maxItems?: number;
  /** When set, applies `max-height` and overflow on the menu. */
  maxHeight?: number | string;
  /** Highlight first option for Enter selection. Default: true. */
  autoSelect?: boolean;
  /** Wrap query matches in <mark>. Default: true. */
  highlight?: boolean;
  /** Resize the menu to match the input width. Default: true. */
  matchWidth?: boolean;
  /** Floating UI placement. Default: 'bottom-start'. */
  placement?: Placement;
  /** Custom option renderer. */
  renderItem?: (item: T, ctx: RenderContext<T>) => HTMLElement;
  /** Renderer for the empty state. Return `null` to hide the menu instead. */
  renderEmpty?: (query: string) => HTMLElement | null;
  /** Override default class names. */
  classNames?: Partial<ClassNamesConfig>;
  /** Custom local matcher predicate. */
  matcher?: (item: T, query: string, display: string) => boolean;
}

export interface TypeaheadEventDetail<T extends TypeaheadItem> {
  select: { item: T; value: unknown; index: number };
  open: undefined;
  close: undefined;
  query: { query: string };
  load: { items: T[]; query: string };
  error: { error: unknown };
}

export type TypeaheadEventName = keyof TypeaheadEventDetail<TypeaheadItem>;
