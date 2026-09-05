import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const options = [
  { value: 'a', label: 'Avenue A' },
  { value: 'b', label: 'Avenue B' },
];

describe('Select', () => {
  it('renders a combobox with options and changes value', async () => {
    const onChange = vi.fn();
    render(<Select aria-label="Avenue" options={options} placeholder="Pick" onChange={onChange} defaultValue="" />);
    const el = screen.getByRole('combobox', { name: 'Avenue' });
    await userEvent.selectOptions(el, 'b');
    expect(el).toHaveValue('b');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('option', { name: 'Pick' })).toBeDisabled();
  });
  it('renders children options when passed', () => {
    render(
      <Select aria-label="x">
        <option value="z">Zed</option>
      </Select>,
    );
    expect(screen.getByRole('option', { name: 'Zed' })).toBeInTheDocument();
  });
  it('has 44px min height and error / disabled states', () => {
    render(<Select aria-label="x" options={options} aria-invalid disabled />);
    const el = screen.getByRole('combobox');
    expect(el.className).toMatch(/min-h-11/);
    expect(el).toHaveAttribute('data-invalid', 'true');
    expect(el).toBeDisabled();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Select aria-label="x" options={options} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] select')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
