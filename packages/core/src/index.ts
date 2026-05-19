export { Typeahead } from './typeahead.js';
export { escapeHtml, escapeRegExp, highlightText, highlightToNodes } from './highlight.js';
export { defaultMatcher, getDisplay, sortMatches } from './matcher.js';
export { debounce } from './debounce.js';
export type { DebouncedFn } from './debounce.js';
export {
  applyComboboxAttrs,
  createAria,
  removeAriaAttrs,
  setActiveDescendant,
  setExpanded,
  uniqueId,
} from './aria.js';
export type { AriaBinding } from './aria.js';
export { attachFloating } from './floating.js';
export type { FloatingController, FloatingOptions } from './floating.js';
export type {
  ClassNamesConfig,
  DisplayField,
  Fetcher,
  Placement,
  RenderContext,
  Source,
  TypeaheadEventDetail,
  TypeaheadEventName,
  TypeaheadItem,
  TypeaheadOptions,
  ValueField,
} from './types.js';
