import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('renders chips and removes via button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput values={['youth', 'health']} onChange={onChange} label="Tags" />);
    expect(screen.getByText('youth')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove health' }));
    expect(onChange).toHaveBeenCalledWith(['youth']);
  });

  it('adds on Enter and comma, trimmed and deduped', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput values={['youth']} onChange={onChange} label="Tags" />);
    const input = screen.getByRole('combobox', { name: 'Tags' });
    await user.type(input, '  env  {Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['youth', 'env']);
    expect(input).toHaveValue('');
    await user.type(input, 'youth,');
    expect(onChange).toHaveBeenCalledTimes(1);
    await user.type(input, 'water,');
    expect(onChange).toHaveBeenLastCalledWith(['youth', 'water']);
    await user.type(input, '   {Enter}');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('Backspace on empty removes last, and respects maxTags', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput values={['a', 'b']} onChange={onChange} label="Tags" maxTags={2} />);
    const input = screen.getByRole('combobox');
    await user.type(input, 'c{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    await user.clear(input);
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('shows filtered suggestions, navigates with arrows and Enter, closes on Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput values={[]} onChange={onChange} label="Tags" suggestions={['Delhi', 'Dehradun', 'Mumbai']} />);
    const input = screen.getByRole('combobox');
    await user.type(input, 'de');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Dehradun' })).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Delhi' })).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(['Delhi']);
    await user.type(input, 'm');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('adds a suggestion on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput values={[]} onChange={onChange} label="Tags" suggestions={['Delhi']} />);
    await user.type(screen.getByRole('combobox'), 'd');
    await user.click(screen.getByRole('option', { name: 'Delhi' }));
    expect(onChange).toHaveBeenCalledWith(['Delhi']);
  });

  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <TagInput values={['x']} onChange={() => {}} label="Tags" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] input')).toBeInTheDocument();
  });
});
