import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { DateInput } from './DateInput';

describe('DateInput', () => {
  it('renders a date input with value and reports changes as YYYY-MM-DD', () => {
    const onChange = vi.fn();
    render(<DateInput aria-label="Event date" value="2026-09-04" onChange={onChange} />);
    const el = screen.getByLabelText('Event date');
    expect(el).toHaveAttribute('type', 'date');
    expect(el).toHaveValue('2026-09-04');
    fireEvent.change(el, { target: { value: '2026-10-01' } });
    expect(onChange).toHaveBeenCalledWith('2026-10-01');
  });
  it('accepts empty value and has 44px min height', () => {
    render(<DateInput aria-label="d" value="" onChange={() => {}} />);
    const el = screen.getByLabelText('d');
    expect(el).toHaveValue('');
    expect(el.className).toMatch(/min-h-11/);
  });
  it('supports error and disabled', () => {
    render(<DateInput aria-label="d" value="" onChange={() => {}} aria-invalid disabled />);
    const el = screen.getByLabelText('d');
    expect(el).toHaveAttribute('data-invalid', 'true');
    expect(el).toBeDisabled();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <DateInput aria-label="d" value="" onChange={() => {}} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] input[type=date]')).toBeInTheDocument();
  });
});
