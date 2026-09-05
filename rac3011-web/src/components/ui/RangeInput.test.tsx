import { render, screen, fireEvent } from '@testing-library/react';
import { RangeInput } from './RangeInput';

describe('RangeInput', () => {
  it('renders a slider with formatted value and min/max labels', () => {
    render(<RangeInput aria-label="Hours" min={0} max={40} value={12} onChange={() => {}} formatValue={(v) => `${v}h`} />);
    const el = screen.getByRole('slider', { name: 'Hours' });
    expect(el).toHaveValue('12');
    expect(screen.getByText('12h')).toBeInTheDocument();
    expect(screen.getByText('0h')).toBeInTheDocument();
    expect(screen.getByText('40h')).toBeInTheDocument();
  });
  it('sets --pct from value and reports numeric change', () => {
    const onChange = vi.fn();
    render(<RangeInput aria-label="h" min={0} max={200} value={50} onChange={onChange} />);
    const el = screen.getByRole('slider');
    expect(el.closest('[data-range]')?.getAttribute('style')).toContain('--pct: 25%');
    fireEvent.change(el, { target: { value: '80' } });
    expect(onChange).toHaveBeenCalledWith(80);
  });
  it('can be disabled', () => {
    render(<RangeInput aria-label="h" min={0} max={10} value={1} onChange={() => {}} disabled />);
    expect(screen.getByRole('slider')).toBeDisabled();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <RangeInput aria-label="h" min={0} max={10} value={5} onChange={() => {}} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] input[type=range]')).toBeInTheDocument();
  });
});
