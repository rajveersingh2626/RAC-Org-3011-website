import { render, screen } from '@testing-library/react';
import { Field, useField } from './Field';
import { Input } from './Input';

function Probe() {
  const f = useField();
  return <span data-testid="probe">{f ? `${f.id}|${f.describedBy ?? ''}|${String(f.invalid)}` : 'none'}</span>;
}

describe('Field', () => {
  it('links label, hint and error to the child input', () => {
    render(
      <Field label="Email" hint="Club address" error="Required">
        <Input placeholder="you@club.org" />
      </Field>,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids).toHaveLength(2);
    expect(screen.getByText('Club address').id).toBe(ids[0]);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
  it('marks required with an sr-only word and aria-hidden asterisk', () => {
    render(
      <Field label="Name" required>
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText(/Name\W*required/)).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });
  it('exposes context via useField and undefined outside', () => {
    render(
      <>
        <Field label="A" id="a">
          <Probe />
        </Field>
        <Probe />
      </>,
    );
    const [inside, outside] = screen.getAllByTestId('probe');
    expect(inside).toHaveTextContent('a||false');
    expect(outside).toHaveTextContent('none');
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Field label="Dark" error="Bad">
          <Input />
        </Field>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] input')).toBeInTheDocument();
    expect(container.querySelector('[data-field]')).toHaveAttribute('data-invalid', 'true');
  });
});
