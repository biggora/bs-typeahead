import { Typeahead as TypeaheadCore } from '@bs-typeahead/core';
import type { TypeaheadItem, TypeaheadOptions } from '@bs-typeahead/core';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface UseTypeaheadResult<T extends TypeaheadItem> {
  inputRef: RefObject<HTMLInputElement | null>;
  instance: TypeaheadCore<T> | null;
  query: string;
  items: readonly T[];
  isOpen: boolean;
  activeIndex: number;
  setQuery: (q: string) => void;
  open: () => void;
  close: () => void;
  select: () => boolean;
  clear: () => void;
}

/**
 * Headless React hook around the typeahead core. The hook exposes reactive
 * snapshots of the core's state and a small set of imperative actions; the
 * caller owns the input element and renders whatever DOM they like.
 */
export function useTypeahead<T extends TypeaheadItem = TypeaheadItem>(
  options: TypeaheadOptions<T>,
): UseTypeaheadResult<T> {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const instanceRef = useRef<TypeaheadCore<T> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [query, setQueryState] = useState('');
  const [items, setItems] = useState<readonly T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!inputRef.current) return;
    const ta = new TypeaheadCore<T>(inputRef.current, optionsRef.current);
    instanceRef.current = ta;
    const offs = [
      ta.on('query', (e) => setQueryState(e.detail.query)),
      ta.on('load', (e) => {
        setItems(e.detail.items);
        setActiveIndex(ta.activeIndex);
      }),
      ta.on('open', () => setIsOpen(true)),
      ta.on('close', () => setIsOpen(false)),
    ];
    return (): void => {
      for (const off of offs) off();
      ta.destroy();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    instanceRef.current?.setSource(options.source);
  }, [options.source]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  }, [options]);

  return {
    inputRef,
    instance: instanceRef.current,
    query,
    items,
    isOpen,
    activeIndex,
    setQuery: (q): void => instanceRef.current?.setQuery(q) ?? undefined,
    open: (): void => instanceRef.current?.open() ?? undefined,
    close: (): void => instanceRef.current?.close() ?? undefined,
    select: (): boolean => instanceRef.current?.select() ?? false,
    clear: (): void => instanceRef.current?.setQuery('') ?? undefined,
  };
}
