import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { Form, useZodForm } from './Form';
import { Field } from './Field';
import { Input } from './Input';

const schema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.string().email('Bad email'),
});
type Values = z.infer<typeof schema>;

function Demo({ onValid }: { onValid: (v: Values) => void | Promise<void> }) {
  const form = useZodForm(schema, { name: '', email: '' });
  return (
    <Form onSubmit={form.handleSubmit(onValid)} submitting={form.submitting}>
      <Field label="Name" error={form.errors.name}>
        <Input value={form.values.name} onChange={(e) => form.setValue('name', e.target.value)} />
      </Field>
      <Field label="Email" error={form.errors.email}>
        <Input value={form.values.email} onChange={(e) => form.setValue('email', e.target.value)} />
      </Field>
      <button type="submit">Save</button>
      <button type="button" onClick={() => form.setServerErrors([{ path: 'email', message: 'Taken' }])}>
        Server
      </button>
      <button type="button" onClick={form.reset}>
        Reset
      </button>
    </Form>
  );
}

describe('Form + useZodForm', () => {
  it('shows zod errors and does not call onValid', async () => {
    const onValid = vi.fn();
    render(<Demo onValid={onValid} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Too short')).toBeInTheDocument();
    expect(screen.getByText('Bad email')).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });
  it('calls onValid with parsed values and clears the field error on edit', async () => {
    const onValid = vi.fn();
    render(<Demo onValid={onValid} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Ra');
    expect(screen.queryByText('Too short')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'r@x.io');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onValid).toHaveBeenCalledWith({ name: 'Ra', email: 'r@x.io' });
  });
  it('sets aria-busy while an async submit is pending', async () => {
    let resolve: () => void = () => {};
    const onValid = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<Demo onValid={onValid} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Ra');
    await userEvent.type(screen.getByLabelText('Email'), 'r@x.io');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const form = document.querySelector('form');
    expect(form).toHaveAttribute('aria-busy', 'true');
    await act(async () => resolve());
    expect(form).not.toHaveAttribute('aria-busy');
  });
  it('applies server errors and reset clears everything', async () => {
    render(<Demo onValid={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Server' }));
    expect(screen.getByText('Taken')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name'), 'Ra');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByText('Taken')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });
  it('renders noValidate in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Demo onValid={() => {}} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] form')).toHaveAttribute('novalidate');
  });
});
