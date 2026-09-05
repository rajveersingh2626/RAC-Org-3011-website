import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox } from './Combobox';

const options = [
  { value: 'delhi', label: 'Delhi', hint: 'RID 3011' },
  { value: 'gurgaon', label: 'Gurgaon' },
  { value: 'noida', label: 'Noida' },
];

describe('Combobox', () => {
  it('renders closed with the selected label', () => {
    render(<Combobox options={options} value="noida" onChange={() => {}} label="Club" />);
    const input = screen.getByRole('combobox', { name: 'Club' });
    expect(input).toHaveValue('Noida');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens on ArrowDown, navigates with wrap, selects with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox options={options} value={null} onChange={onChange} label="Club" />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: /Delhi/ }).id);
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('option', { name: /Gurgaon/ })).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('gurgaon');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('filters by typing and supports Home/End', async () => {
    const user = userEvent.setup();
    render(<Combobox options={options} value={null} onChange={() => {}} label="Club" />);
    await user.type(screen.getByRole('combobox'), 'oi');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.clear(screen.getByRole('combobox'));
    await user.keyboard('{End}');
    expect(screen.getByRole('option', { name: /Noida/ })).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{Home}');
    expect(screen.getByRole('option', { name: /Delhi/ })).toHaveAttribute('data-highlighted', 'true');
  });

  it('shows emptyText when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Combobox options={options} value={null} onChange={() => {}} label="Club" emptyText="Nothing" />);
    await user.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('Nothing')).toBeInTheDocument();
  });

  it('selects on click and marks aria-selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox options={options} value="delhi" onChange={onChange} label="Club" />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /Delhi/ })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('option', { name: /Noida/ }));
    expect(onChange).toHaveBeenCalledWith('noida');
  });

  it('closes on Escape and restores the selected label', async () => {
    const user = userEvent.setup();
    render(<Combobox options={options} value="delhi" onChange={() => {}} label="Club" />);
    const input = screen.getByRole('combobox');
    await user.type(input, 'x');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('Delhi');
  });

  it('is disabled', () => {
    render(<Combobox options={options} value={null} onChange={() => {}} label="Club" disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <Combobox options={options} value={null} onChange={() => {}} label="Club" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role="combobox"]')).toBeInTheDocument();
  });
});
