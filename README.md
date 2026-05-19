# bs-typeahead

A framework-agnostic typeahead/autocomplete for Bootstrap 5.3, with a thin React wrapper.

The original `bootstrap-ajax-typeahead` was a jQuery plugin written against Bootstrap 2 and Grunt 0.4. This is a complete rewrite — TypeScript, ESM, WAI-ARIA combobox pattern, `@floating-ui/dom` positioning, AbortController-aware async sources, and a React 19 wrapper that survives StrictMode without leaks.

## Repository layout

This is a pnpm workspace with three packages:

| Package | Purpose |
|---|---|
| [`@bs-typeahead/core`](./packages/core) | The vanilla TS class. No framework dependencies; only `@floating-ui/dom` at runtime. |
| [`@bs-typeahead/react`](./packages/react) | Tiny React 19 wrapper — `<Typeahead />` component and `useTypeahead` hook. |
| [`@bs-typeahead/playground`](./packages/playground) | Vite playground with 10 live scenarios (8 ported from the original demo + a React showcase + an a11y inspector). |

The core has no dependency on React; the React wrapper has no logic of its own — it forwards every prop into the core's imperative API. This split is what makes any other framework wrapper (Vue, Solid, Svelte) a one-day job.

## Vanilla quick start

```ts
import { Typeahead } from '@bs-typeahead/core';
import '@bs-typeahead/core/styles.css';
// You also need Bootstrap 5.3's CSS for .dropdown-menu / .dropdown-item.

const input = document.querySelector<HTMLInputElement>('#search')!;

const ta = new Typeahead<{ id: number; name: string }>(input, {
  source: [
    { id: 1, name: 'Toronto' },
    { id: 2, name: 'Montreal' },
  ],
  displayField: 'name',
  valueField: 'id',
});

ta.on('select', (e) => console.log(e.detail.item, e.detail.value));
```

## React quick start

```tsx
import { Typeahead } from '@bs-typeahead/react';

<Typeahead<City>
  source={cities}
  displayField="name"
  valueField="id"
  placeholder="Search..."
  className="form-control"
  onSelect={(detail) => console.log(detail.item)}
/>
```

Async source:

```tsx
<Typeahead<City>
  source={async (query, signal) => {
    const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`, { signal });
    return res.json();
  }}
  displayField="name"
  debounceMs={250}
  minLength={2}
/>
```

A headless hook is available when you need direct access to the core's state:

```tsx
const { inputRef, items, isOpen, select } = useTypeahead<City>({
  source: cities,
  displayField: 'name',
});
return <input ref={inputRef} />;
```

## Options

All options live on `TypeaheadOptions<T>` exported from `@bs-typeahead/core`. The most useful ones:

| Option | Type | Default | Purpose |
|---|---|---|---|
| `source` | `T[] \| (query, signal) => Promise<T[]>` | — | Local array or async fetcher. |
| `displayField` | `keyof T \| (item) => string` | `'name'` | Field shown in the menu and matched against. |
| `valueField` | `keyof T` | `'id'` | Field returned in the `select` event. |
| `minLength` | `number` | `1` | Minimum query length to trigger a lookup. |
| `debounceMs` | `number` | `300` | Debounce window for async sources. |
| `maxItems` | `number` | `10` | Cap on rendered options. |
| `maxHeight` | `number \| string` | — | Apply `max-height` + scroll on the menu. |
| `autoSelect` | `boolean` | `true` | Highlight the first option so `Enter` commits it. |
| `highlight` | `boolean` | `true` | Wrap query matches in `<mark>`. |
| `matchWidth` | `boolean` | `true` | Resize the menu to the input's width. |
| `placement` | `Placement` | `'bottom-start'` | Floating UI placement. |
| `renderItem` | `(item, ctx) => HTMLElement` | — | Custom option renderer. |
| `renderEmpty` | `(query) => HTMLElement \| null` | — | Empty-state renderer; return `null` to hide the menu. |
| `classNames` | `Partial<ClassNamesConfig>` | Bootstrap 5 | Override `menu` / `item` / `active` / `shown` class names. |
| `matcher` | `(item, query, display) => boolean` | substring | Custom predicate for local sources. |

## Events

Subscribe via `ta.on(name, handler)` (returns an unsubscribe function) or the standard `addEventListener` API:

| Name | Detail |
|---|---|
| `query` | `{ query: string }` — emitted on every `setQuery`. |
| `load` | `{ items: T[]; query: string }` — emitted after a lookup resolves. |
| `select` | `{ item: T; value: unknown; index: number }` — emitted when the user commits an option. |
| `open` / `close` | no payload — menu visibility changes. |
| `error` | `{ error: unknown }` — async fetcher rejection. |

## Migrating from 0.0.5

The old jQuery plugin is gone. The closest mapping:

| Old | New |
|---|---|
| `$el.typeahead({ source: [...] })` | `new Typeahead(el, { source: [...] })` |
| `ajax: '/url'` | `source: async (q, signal) => (await fetch('/url?q=' + q, { signal })).json()` |
| `ajax: { url, method, preDispatch, preProcess }` | The fetcher is your own function — build the request however you like. |
| `triggerLength` | `minLength` |
| `items` (the cap) | `maxItems` |
| `alignWidth` | `matchWidth` |
| `scrollBar: true` | `maxItems: 100, maxHeight: 220` |
| `onSelect: fn` | `ta.on('select', fn)` or React `onSelect` prop |
| `loadingClass` | `[data-loading="true"]` attribute on the input + your CSS |
| `data-provide="typeahead"` auto-init | Removed — incompatible with React StrictMode and SSR. |

## Development

```bash
pnpm install
pnpm dev          # opens the playground at http://localhost:5173
pnpm test         # vitest run (across packages)
pnpm typecheck
pnpm lint
pnpm build        # tsup for core/react
```

See [`CLAUDE.md`](./CLAUDE.md) for the architectural overview Claude Code uses.

## License

MIT © Twitter Inc., Paul Warelis, Alexey Gordeyev. See [`LICENSE`](./LICENSE).
