import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReportField } from '@/lib/reports/types';
import { ReportFieldControl } from './ReportFieldControl';

function baseField(overrides: Partial<ReportField>): ReportField {
  return {
    id: 'f1',
    section: 'Section',
    fieldKey: 'field_key',
    label: 'Field label',
    type: 'text',
    options: null,
    required: true,
    order: 0,
    helpText: null,
    perActivity: false,
    pointSourceKey: null,
    ...overrides,
  };
}

function Harness({ field, initial }: { field: ReportField; initial: unknown }) {
  const [value, setValue] = useState(initial);
  return <ReportFieldControl field={field} value={value} onChange={setValue} clubOptions={[]} error={undefined} />;
}

describe('ReportFieldControl dynamic rendering', () => {
  it('renders a text input', () => {
    render(<Harness field={baseField({ type: 'text' })} initial="" />);
    expect(screen.getByLabelText(/Field label/)).toBeInTheDocument();
  });

  it('renders a textarea', () => {
    render(<Harness field={baseField({ type: 'textarea' })} initial="" />);
    expect(screen.getByRole('textbox', { name: /Field label/ }).tagName).toBe('TEXTAREA');
  });

  it('renders a number input', async () => {
    render(<Harness field={baseField({ type: 'number' })} initial="" />);
    const input = screen.getByLabelText(/Field label/) as HTMLInputElement;
    expect(input.type).toBe('number');
    await userEvent.type(input, '42');
    expect(input).toHaveValue(42);
  });

  it('renders a date input', () => {
    render(<Harness field={baseField({ type: 'date' })} initial="" />);
    const input = screen.getByLabelText(/Field label/) as HTMLInputElement;
    expect(input.type).toBe('date');
  });

  it('renders a boolean checkbox', async () => {
    render(<Harness field={baseField({ type: 'boolean', required: false })} initial={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('renders a select with humanized choices from live options', () => {
    render(<Harness field={baseField({ type: 'select', options: { choices: ['community', 'club'] } })} initial="" />);
    expect(screen.getByRole('option', { name: 'Community' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Club' })).toBeInTheDocument();
  });

  it('renders a multiselect with humanized choices', async () => {
    render(<Harness field={baseField({ type: 'multiselect', options: { choices: ['vocational'] } })} initial={[]} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Vocational' })).toBeInTheDocument();
  });

  it('renders a clubs multiselect using the given club options', async () => {
    const field = baseField({ type: 'clubs' });
    render(
      <ReportFieldControl
        field={field}
        value={[]}
        onChange={() => undefined}
        clubOptions={[{ value: 'club_a', label: 'Rotaract Club A' }]}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Rotaract Club A' })).toBeInTheDocument();
  });

  it('surfaces a validation error message', () => {
    render(
      <ReportFieldControl field={baseField({ type: 'text' })} value="" onChange={() => undefined} clubOptions={[]} error="Field label is required" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Field label is required');
  });

  it('shows an Optional badge for non-required fields', () => {
    render(<Harness field={baseField({ type: 'text', required: false })} initial="" />);
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });
});
