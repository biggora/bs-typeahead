import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { useTypeahead } from '../src/useTypeahead.js';

interface City {
  id: number;
  name: string;
}
const cities: City[] = [
  { id: 1, name: 'Toronto' },
  { id: 2, name: 'Montreal' },
];

afterEach(() => {
  cleanup();
});

function Harness(): React.ReactElement {
  const { inputRef, query, items, isOpen } = useTypeahead<City>({
    source: cities,
    displayField: 'name',
  });
  return (
    <div>
      <input ref={inputRef} placeholder="Search" />
      <div data-testid="query">{query}</div>
      <div data-testid="items-count">{items.length}</div>
      <div data-testid="open">{isOpen ? 'yes' : 'no'}</div>
    </div>
  );
}

describe('useTypeahead', () => {
  it('exposes reactive state snapshots to React consumers', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByPlaceholderText('Search'), 'to');

    expect(screen.getByTestId('query').textContent).toBe('to');
    expect(Number(screen.getByTestId('items-count').textContent)).toBeGreaterThan(0);
    expect(screen.getByTestId('open').textContent).toBe('yes');
  });

  it('tears down the core when the component unmounts', () => {
    const { unmount } = render(<Harness />);
    expect(document.querySelectorAll('[role="listbox"]').length).toBe(1);

    unmount();

    expect(document.querySelectorAll('[role="listbox"]').length).toBe(0);
  });
});
