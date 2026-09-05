import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

const tabs = [
  { id: 'dash', label: 'Dashboard' },
  { id: 'reports', label: 'My reports', badge: <span>2</span> },
  { id: 'ann', label: 'Announcements' },
  { id: 'res', label: 'Resources' },
];

function Harness() {
  const [value, setValue] = useState('dash');
  return (
    <Tabs tabs={tabs} value={value} onChange={setValue} label="Portal sections">
      <p>Panel {value}</p>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('wires the ARIA tabs pattern', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Portal sections');
    const active = screen.getByRole('tab', { name: /Dashboard/ });
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(active).toHaveAttribute('aria-controls', 'tabpanel-dash');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-dash');
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(active.className).toMatch(/border-accent/);
    expect(active.className).toMatch(/min-h-11/);
  });
  it('is one tab stop (roving tabindex)', () => {
    render(<Harness />);
    const stops = screen.getAllByRole('tab').filter((t) => t.getAttribute('tabindex') === '0');
    expect(stops).toHaveLength(1);
  });
  it('moves selection and focus with arrow keys, wrapping', async () => {
    render(<Harness />);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: /Dashboard/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    const second = screen.getByRole('tab', { name: /My reports/ });
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel reports');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Resources' })).toHaveFocus();
  });
  it('supports Home and End', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: 'Announcements' }));
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Resources' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: /Dashboard/ })).toHaveAttribute('aria-selected', 'true');
  });
  it('calls onChange on click', async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} value="dash" onChange={onChange} label="L" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Resources' }));
    expect(onChange).toHaveBeenCalledWith('res');
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Harness />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role=tablist]')).toBeInTheDocument();
  });
});
