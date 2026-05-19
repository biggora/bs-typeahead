import { Typeahead as TypeaheadCore } from '@bs-typeahead/core';
import type {
  Fetcher,
  TypeaheadEventDetail,
  TypeaheadItem,
  TypeaheadOptions,
} from '@bs-typeahead/core';
import { useEffect, useRef } from 'react';
import type { InputHTMLAttributes, Ref } from 'react';

type CoreOptionKeys =
  | 'displayField'
  | 'valueField'
  | 'minLength'
  | 'debounceMs'
  | 'maxItems'
  | 'maxHeight'
  | 'autoSelect'
  | 'highlight'
  | 'matchWidth'
  | 'placement'
  | 'renderItem'
  | 'renderEmpty'
  | 'classNames'
  | 'matcher';

type InputBaseProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onSelect' | 'onChange' | 'onError' | 'onLoad' | 'value' | 'defaultValue' | 'ref'
>;

export interface TypeaheadProps<T extends TypeaheadItem = TypeaheadItem>
  extends Pick<TypeaheadOptions<T>, CoreOptionKeys>,
    InputBaseProps {
  source: T[] | Fetcher<T>;
  /** Initial value for uncontrolled usage. */
  defaultValue?: string;
  /** Controlled value; pair with `onValueChange` to receive updates. */
  value?: string;
  onValueChange?: (value: string) => void;
  onSelect?: (detail: TypeaheadEventDetail<T>['select']) => void;
  onLoad?: (detail: TypeaheadEventDetail<T>['load']) => void;
  onError?: (detail: TypeaheadEventDetail<T>['error']) => void;
  onOpen?: () => void;
  onClose?: () => void;
  /** Ref to the underlying input element. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * React wrapper around the framework-agnostic Typeahead core.
 *
 * The wrapper instantiates the core exactly once per mounted component and
 * routes all subsequent option changes through the core's imperative API.
 * The input is *not* a controlled React input — the core writes to
 * `input.value` directly, which is the only way to keep the input, the menu
 * and selection state in sync when the consumer wraps a vanilla widget.
 */
export function Typeahead<T extends TypeaheadItem = TypeaheadItem>(
  props: TypeaheadProps<T>,
): React.ReactElement {
  const {
    source,
    displayField,
    valueField,
    minLength,
    debounceMs,
    maxItems,
    maxHeight,
    autoSelect,
    highlight,
    matchWidth,
    placement,
    renderItem,
    renderEmpty,
    classNames,
    matcher,
    value,
    defaultValue,
    onValueChange,
    onSelect,
    onLoad,
    onError,
    onOpen,
    onClose,
    ref,
    ...inputProps
  } = props;

  const innerRef = useRef<HTMLInputElement | null>(null);
  const instanceRef = useRef<TypeaheadCore<T> | null>(null);

  // Keep callbacks in a ref so they can change without recreating the core.
  const callbacksRef = useRef({
    onSelect,
    onLoad,
    onError,
    onOpen,
    onClose,
    onValueChange,
  });
  callbacksRef.current = {
    onSelect,
    onLoad,
    onError,
    onOpen,
    onClose,
    onValueChange,
  };

  // One-time mount: create the core, subscribe to events, destroy on unmount.
  useEffect(() => {
    if (!innerRef.current) return;
    const input = innerRef.current;
    const ta = new TypeaheadCore<T>(input, {
      source,
      ...(displayField !== undefined && { displayField }),
      ...(valueField !== undefined && { valueField }),
      ...(minLength !== undefined && { minLength }),
      ...(debounceMs !== undefined && { debounceMs }),
      ...(maxItems !== undefined && { maxItems }),
      ...(maxHeight !== undefined && { maxHeight }),
      ...(autoSelect !== undefined && { autoSelect }),
      ...(highlight !== undefined && { highlight }),
      ...(matchWidth !== undefined && { matchWidth }),
      ...(placement !== undefined && { placement }),
      ...(renderItem !== undefined && { renderItem }),
      ...(renderEmpty !== undefined && { renderEmpty }),
      ...(classNames !== undefined && { classNames }),
      ...(matcher !== undefined && { matcher }),
    });
    instanceRef.current = ta;

    if (value !== undefined) ta.setQuery(value);

    const offs = [
      ta.on('select', (e) => callbacksRef.current.onSelect?.(e.detail)),
      ta.on('load', (e) => callbacksRef.current.onLoad?.(e.detail)),
      ta.on('error', (e) => callbacksRef.current.onError?.(e.detail)),
      ta.on('open', () => callbacksRef.current.onOpen?.()),
      ta.on('close', () => callbacksRef.current.onClose?.()),
      ta.on('query', (e) => callbacksRef.current.onValueChange?.(e.detail.query)),
    ];

    return (): void => {
      for (const off of offs) off();
      ta.destroy();
      instanceRef.current = null;
    };
    // Intentionally empty deps: the core is instantiated once per mount. All
    // later prop changes flow through the dedicated sync effects below — this
    // is the only way to keep refs and the imperative API stable across renders.
  }, []);

  // Sync source (separately, because it may change without triggering an
  // option-wide diff).
  useEffect(() => {
    instanceRef.current?.setSource(source);
  }, [source]);

  // Sync the remaining options on any change.
  useEffect(() => {
    instanceRef.current?.setOptions({
      ...(displayField !== undefined && { displayField }),
      ...(valueField !== undefined && { valueField }),
      ...(minLength !== undefined && { minLength }),
      ...(debounceMs !== undefined && { debounceMs }),
      ...(maxItems !== undefined && { maxItems }),
      ...(maxHeight !== undefined && { maxHeight }),
      ...(autoSelect !== undefined && { autoSelect }),
      ...(highlight !== undefined && { highlight }),
      ...(matchWidth !== undefined && { matchWidth }),
      ...(placement !== undefined && { placement }),
      ...(renderItem !== undefined && { renderItem }),
      ...(renderEmpty !== undefined && { renderEmpty }),
      ...(classNames !== undefined && { classNames }),
      ...(matcher !== undefined && { matcher }),
    });
  }, [
    displayField,
    valueField,
    minLength,
    debounceMs,
    maxItems,
    maxHeight,
    autoSelect,
    highlight,
    matchWidth,
    placement,
    renderItem,
    renderEmpty,
    classNames,
    matcher,
  ]);

  // Controlled value sync.
  useEffect(() => {
    if (value !== undefined) instanceRef.current?.setQuery(value);
  }, [value]);

  const setRefs = (el: HTMLInputElement | null): void => {
    innerRef.current = el;
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref && typeof ref === 'object' && 'current' in ref) {
      (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    }
  };

  return <input ref={setRefs} defaultValue={defaultValue} {...inputProps} />;
}
