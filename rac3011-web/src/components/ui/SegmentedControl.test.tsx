import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'list', label: 'List' },
  { value: 'month', label: 'Month' },
  { value: 'map', label: 'Map' },
];

function Harness() {
  const [value, setValue] = useState('list');
  return <SegmentedControl options={options} value={value} onChange={setValue} label="View" />;
}

describe('SegmentedControl', () => {
  it('renders a radiogroup of 44px segments with the active one filled', () => {
    render(<Harness />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'View');
    const active = screen.getByRole('radio', { name: 'List' });
    expect(active).toHaveAttribute('aria-checked', 'true');
    expect(active.className).toMatch(/bg-accent/);
    expect(active.className).toMatch(/min-h-11/);
    expect(screen.getByRole('radio', { name: 'Map' }).className).toMatch(/border-line/);
  });
  it('is one tab stop', () => {
    render(<Harness />);
    expect(screen.getAllByRole('radio').filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1);
  });
  it('selects with arrow keys and wraps', async () => {
    render(<Harness />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'List' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    const last = screen.getByRole('radio', { name: 'Map' });
    expect(last).toHaveAttribute('aria-checked', 'true');
    expect(last).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('radio', { name: 'Map' })).toHaveAttribute('aria-checked', 'true');
  });
  it('calls onChange on click', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={options} value="list" onChange={onChange} label="View" />);
    await userEvent.click(screen.getByRole('radio', { name: 'Map' }));
    expect(onChange).toHaveBeenCalledWith('map');
  });
  it('scrolls rather than wrapping beyond four options', () => {
    render(
      <SegmentedControl
        options={[...options, { value: 'grid', label: 'Grid' }, { value: 'table', label: 'Table' }]}
        value="list"
        onChange={() => {}}
        label="View"
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-overflow', 'scroll');
    expect(group.className).toMatch(/flex-nowrap/);
    expect(group.className).toMatch(/overflow-x-auto/);
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Harness />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role=radiogroup]')).toBeInTheDocument();
  });
});
