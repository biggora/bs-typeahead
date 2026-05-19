import { autoUpdate, computePosition, flip, shift, size } from '@floating-ui/dom';
import type { Placement } from './types.js';

export interface FloatingController {
  update(): void;
  destroy(): void;
}

export interface FloatingOptions {
  placement: Placement;
  matchWidth: boolean;
  maxHeight?: number | string | undefined;
}

/**
 * Wires Floating UI's autoUpdate to position `floating` against `reference`.
 * Call destroy() to detach scroll/resize listeners and reset inline styles.
 */
export function attachFloating(
  reference: HTMLElement,
  floating: HTMLElement,
  opts: FloatingOptions,
): FloatingController {
  const middleware = [
    flip({ padding: 8 }),
    shift({ padding: 8 }),
    size({
      apply({ rects, availableHeight, elements }) {
        const target = elements.floating as HTMLElement;
        if (opts.matchWidth) {
          target.style.minWidth = `${rects.reference.width}px`;
        }
        const explicit = opts.maxHeight;
        const cap =
          typeof explicit === 'number'
            ? `${explicit}px`
            : typeof explicit === 'string'
              ? explicit
              : `${Math.max(availableHeight - 8, 80)}px`;
        target.style.maxHeight = cap;
        target.style.overflowY = 'auto';
      },
    }),
  ];

  const update = (): void => {
    void computePosition(reference, floating, {
      placement: opts.placement,
      middleware,
      strategy: 'absolute',
    }).then(({ x, y }) => {
      Object.assign(floating.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  };

  const cleanup = autoUpdate(reference, floating, update);

  return {
    update,
    destroy(): void {
      cleanup();
      floating.style.left = '';
      floating.style.top = '';
      floating.style.minWidth = '';
      floating.style.maxHeight = '';
      floating.style.overflowY = '';
    },
  };
}
