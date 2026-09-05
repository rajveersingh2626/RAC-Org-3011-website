import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Radio, RadioGroup } from './Radio';

const options = [
  { value: 'in', label: 'In person' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid', disabled: true },
];

function Controlled() {
  const [v, setV] = useState('in');
  return <RadioGroup legend="Mode" name="mode" value={v} onChange={setV} options={options} />;
}

describe('Radio', () => {
  it('renders a single option with label', () => {
    render(<Radio name="r" value="a" label="Alpha" />);
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('radio').closest('label')?.className).toMatch(/min-h-11/);
  });
  it('RadioGroup renders fieldset with legend and selects on click', async () => {
    render(<Controlled />);
    expect(screen.getByRole('group', { name: 'Mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'In person' })).toBeChecked();
    await userEvent.click(screen.getByText('Online'));
    expect(screen.getByRole('radio', { name: 'Online' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Hybrid' })).toBeDisabled();
  });
  it('moves with arrow keys', async () => {
    render(<Controlled />);
    screen.getByRole('radio', { name: 'In person' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Online' })).toBeChecked();
  });
  it('shows error text and renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <RadioGroup legend="Mode" name="m" value="" onChange={() => {}} options={options} error="Pick one" />
      </div>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Pick one');
    expect(container.querySelector('[data-theme="dark"] fieldset')).toHaveAttribute('aria-invalid', 'true');
  });
});
