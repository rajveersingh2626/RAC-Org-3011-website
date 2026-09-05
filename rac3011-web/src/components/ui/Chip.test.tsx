import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Chip } from './Chip';

function Toggle() {
  const [on, setOn] = useState(false);
  return <Chip selected={on} onClick={() => setOn((v) => !v)}>Community</Chip>;
}

describe('Chip', () => {
  it('renders as aria-pressed button and toggles on click', async () => {
    render(<Toggle />);
    const b = screen.getByRole('button', { name: 'Community' });
    expect(b).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(b);
    expect(b).toHaveAttribute('aria-pressed', 'true');
    expect(b.className).toMatch(/bg-accent /);
  });
  it('keeps 44px min height and shows count', () => {
    render(<Chip count={12}>Zone 4</Chip>);
    const b = screen.getByRole('button', { name: /Zone 4/ });
    expect(b.className).toMatch(/min-h-11/);
    expect(screen.getByText('12')).toBeInTheDocument();
  });
  it('renders a remove control when onRemove given', async () => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    render(<Chip selected onRemove={onRemove} onClick={onClick}>Tag</Chip>);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Tag' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
  it('supports the label prop and removes via keyboard', async () => {
    const onRemove = vi.fn();
    render(<Chip label="Zone 4" onRemove={onRemove} />);
    const rm = screen.getByRole('button', { name: 'Remove Zone 4' });
    rm.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
  it('does not remove when disabled', async () => {
    const onRemove = vi.fn();
    render(<Chip label="Tag" disabled onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Tag' }));
    expect(onRemove).not.toHaveBeenCalled();
  });
  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <Chip>Dark</Chip>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] button')).toBeInTheDocument();
  });
});
