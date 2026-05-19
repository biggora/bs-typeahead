import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Typeahead } from '../src/Typeahead.js';

const cities = [
  { id: 1, name: 'Toronto' },
  { id: 2, name: 'Montreal' },
  { id: 3, name: 'Tokyo' },
];

afterEach(() => {
  cleanup();
});

describe('<Typeahead>', () => {
  it('renders an input wired as a WAI-ARIA combobox', () => {
    render(<Typeahead source={cities} displayField="name" placeholder="Search" />);
    const input = screen.getByPlaceholderText('Search');
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('opens the listbox and renders matches when the user types', async () => {
    const user = userEvent.setup();
    render(<Typeahead source={cities} displayField="name" placeholder="Search" />);

    const input = screen.getByPlaceholderText('Search');
    await user.type(input, 'to');

    expect(screen.queryByRole('listbox')).not.toBeNull();
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });

  it('fires onSelect with the chosen item and resolved value', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Typeahead
        source={cities}
        displayField="name"
        valueField="id"
        onSelect={onSelect}
        placeholder="Search"
      />,
    );

    const input = screen.getByPlaceholderText('Search');
    await user.type(input, 'to');
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({
      item: { id: 1, name: 'Toronto' },
      value: 1,
    });
  });

  it('cleans up on unmount — no leaked listbox in the DOM', () => {
    const { unmount } = render(<Typeahead source={cities} displayField="name" />);
    expect(document.querySelectorAll('[role="listbox"]').length).toBe(1);

    unmount();

    expect(document.querySelectorAll('[role="listbox"]').length).toBe(0);
  });

  it('survives a React.StrictMode double-mount with exactly one live listbox', () => {
    const { unmount } = render(
      <StrictMode>
        <Typeahead source={cities} displayField="name" />
      </StrictMode>,
    );

    expect(document.querySelectorAll('[role="listbox"]').length).toBe(1);

    unmount();

    expect(document.querySelectorAll('[role="listbox"]').length).toBe(0);
  });

  it('honours a controlled `value` prop by pushing it into the core', () => {
    const { rerender } = render(
      <Typeahead source={cities} displayField="name" value="" />,
    );
    const input = screen.getByRole('combobox') as HTMLInputElement;

    rerender(<Typeahead source={cities} displayField="name" value="to" />);

    expect(input.value).toBe('to');
    expect(screen.queryByRole('listbox')?.style.display).toBe('block');
  });

  it('exposes the underlying input via a forwarded ref', () => {
    const ref: { current: HTMLInputElement | null } = { current: null };
    render(<Typeahead source={cities} displayField="name" ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('INPUT');
  });

  it('calls onValueChange while the user types', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Typeahead
        source={cities}
        displayField="name"
        onValueChange={onValueChange}
        placeholder="Search"
      />,
    );

    await user.type(screen.getByPlaceholderText('Search'), 'to');

    expect(onValueChange).toHaveBeenCalled();
    expect(onValueChange.mock.calls[onValueChange.mock.calls.length - 1]?.[0]).toBe('to');
  });
});
