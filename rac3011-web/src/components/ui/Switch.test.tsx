import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders role=switch with label and toggles on click', async () => {
    const onChange = vi.fn();
    render(<Switch label="Email digests" description="Weekly summary" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Email digests' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Weekly summary')).toBeInTheDocument();
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
  it('reflects on state and 44px row', () => {
    render(<Switch label="On" checked onChange={() => {}} />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(sw).toHaveAttribute('data-state', 'on');
    expect(sw.closest('[data-switch-row]')?.className).toMatch(/min-h-11/);
  });
  it('is disabled', () => {
    render(<Switch label="x" checked={false} onChange={() => {}} disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
  it('works without label using aria-label and in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Switch aria-label="Dark mode" checked onChange={() => {}} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role=switch]')).toHaveAccessibleName('Dark mode');
  });
});
