import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a labelled checkbox and toggles on click', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Agree to code of conduct" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Agree to code of conduct' });
    expect(box).not.toBeChecked();
    await userEvent.click(screen.getByText('Agree to code of conduct'));
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it('toggles with keyboard space', async () => {
    render(<Checkbox label="Kb" />);
    const box = screen.getByRole('checkbox');
    box.focus();
    await userEvent.keyboard(' ');
    expect(box).toBeChecked();
  });
  it('row carries 44px target and states', () => {
    render(<Checkbox label="x" disabled aria-invalid />);
    const row = screen.getByRole('checkbox').closest('label');
    expect(row?.className).toMatch(/min-h-11/);
    expect(row).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Checkbox label="Dark" defaultChecked />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] input[type=checkbox]')).toBeChecked();
  });
});
