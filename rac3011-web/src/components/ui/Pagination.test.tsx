import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination, paginationRange } from './Pagination';

describe('paginationRange', () => {
  it('returns every page when the total is small', () => {
    expect(paginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it('collapses a large run into one ellipsis around the current page', () => {
    expect(paginationRange(2, 20)).toEqual([1, 2, 3, 'ellipsis', 20]);
  });
  it('collapses both sides when the current page is in the middle', () => {
    expect(paginationRange(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
  });
  it('never emits two adjacent ellipses', () => {
    expect(paginationRange(1, 1)).toEqual([1]);
  });
});

describe('Pagination', () => {
  it('renders a labelled nav with page buttons, current page marked', () => {
    render(<Pagination page={2} totalPages={7} onChange={() => {}} label="Reports table pages" />);
    const nav = screen.getByRole('navigation', { name: 'Reports table pages' });
    expect(nav).toBeInTheDocument();
    const current = screen.getByRole('button', { name: '2' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.className).toMatch(/bg-accent/);
    const other = screen.getByRole('button', { name: '3' });
    expect(other).not.toHaveAttribute('aria-current');
  });

  it('renders an ellipsis that is not a button', () => {
    render(<Pagination page={2} totalPages={20} onChange={() => {}} label="Pages" />);
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '…' })).not.toBeInTheDocument();
  });

  it('disables Previous on the first page and Next on the last page', () => {
    render(<Pagination page={1} totalPages={3} onChange={() => {}} label="Pages" />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next/ })).not.toBeDisabled();
  });

  it('disables Next on the last page', () => {
    render(<Pagination page={3} totalPages={3} onChange={() => {}} label="Pages" />);
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Previous/ })).not.toBeDisabled();
  });

  it('calls onChange with the target page on click', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={7} onChange={onChange} label="Pages" />);
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(onChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('gives every control a 44px hit target', () => {
    render(<Pagination page={2} totalPages={7} onChange={() => {}} label="Pages" />);
    for (const button of screen.getAllByRole('button')) {
      expect(button.className).toMatch(/min-h-11/);
    }
  });

  it('renders a single page with both controls disabled', () => {
    render(<Pagination page={1} totalPages={1} onChange={() => {}} label="Pages" />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
  });

  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Pagination page={2} totalPages={7} onChange={() => {}} label="Pages" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] nav')).toBeInTheDocument();
  });
});
