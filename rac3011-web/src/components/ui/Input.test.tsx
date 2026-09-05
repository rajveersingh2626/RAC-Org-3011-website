import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders a textbox and accepts typing', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Club name" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Club name' });
    await userEvent.type(input, 'RAC');
    expect(input).toHaveValue('RAC');
    expect(onChange).toHaveBeenCalledTimes(3);
  });
  it('has 44px min height and control styling', () => {
    render(<Input aria-label="x" />);
    expect(screen.getByRole('textbox').className).toMatch(/min-h-11/);
  });
  it('marks error state', () => {
    render(<Input aria-label="x" aria-invalid />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-invalid', 'true');
  });
  it('can be disabled', () => {
    render(<Input aria-label="x" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Input aria-label="x" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] input')).toBeInTheDocument();
  });
});
