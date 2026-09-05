import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from './MultiSelect';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', hint: 'second' },
  { value: 'c', label: 'Gamma' },
];

describe('MultiSelect', () => {
  it('renders chips for selected values with remove buttons', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} values={['a', 'c']} onChange={onChange} label="Tags" />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Gamma' }));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('opens a multiselectable listbox and toggles with keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} values={['a']} onChange={onChange} label="Tags" />);
    const input = screen.getByRole('combobox', { name: 'Tags' });
    await user.click(input);
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: /Alpha/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: /Beta/ })).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
    await user.keyboard('{ArrowUp}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith([]);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('wraps arrow navigation', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} values={[]} onChange={() => {}} label="Tags" />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: /Gamma/ })).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /Alpha/ })).toHaveAttribute('data-highlighted', 'true');
  });

  it('filters by typing and selects on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} values={[]} onChange={onChange} label="Tags" />);
    await user.type(screen.getByRole('combobox'), 'gam');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.click(screen.getByRole('option', { name: /Gamma/ }));
    expect(onChange).toHaveBeenCalledWith(['c']);
  });

  it('Backspace on empty input removes the last chip', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} values={['a', 'b']} onChange={onChange} label="Tags" />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <MultiSelect options={options} values={['a']} onChange={() => {}} label="Tags" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role="combobox"]')).toBeInTheDocument();
  });
});
