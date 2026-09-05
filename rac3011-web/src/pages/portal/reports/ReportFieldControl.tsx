import { Checkbox } from '@/components/ui/Checkbox';
import { DateInput } from '@/components/ui/DateInput';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { ComboboxOption } from '@/components/ui/Combobox';
import type { ReportField } from '@/lib/reports/types';
import { humanize, linkAllowsMultiple, selectChoices } from '@/lib/reports/values';
import { LinkFieldControl } from './LinkFieldControl';

export interface ReportFieldControlProps {
  field: ReportField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  clubOptions: ComboboxOption[];
  disabled?: boolean;
}

export function ReportFieldControl({ field, value, onChange, onBlur, error, clubOptions, disabled }: ReportFieldControlProps) {
  const label = (
    <>
      {field.label}
      {!field.required && <span className="ml-1 font-normal text-fg-3">Optional</span>}
    </>
  );

  switch (field.type) {
    case 'text':
      return (
        <Field label={label} required={field.required} hint={field.helpText} error={error}>
          <Input value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} disabled={disabled} />
        </Field>
      );
    case 'textarea':
      return (
        <Field label={label} required={field.required} hint={field.helpText} error={error}>
          <Textarea value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} disabled={disabled} />
        </Field>
      );
    case 'number':
      return (
        <Field label={label} required={field.required} hint={field.helpText} error={error}>
          <Input
            type="number"
            inputMode="numeric"
            value={typeof value === 'number' ? String(value) : typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={onBlur}
            disabled={disabled}
          />
        </Field>
      );
    case 'date':
      return (
        <Field label={label} required={field.required} hint={field.helpText} error={error}>
          <DateInput value={typeof value === 'string' ? value : ''} onChange={(v) => { onChange(v); onBlur?.(); }} disabled={disabled} />
        </Field>
      );
    case 'boolean':
      return (
        <Field label={field.helpText ?? ''} error={error} className={field.helpText ? undefined : 'gap-0'}>
          <Checkbox
            label={label}
            checked={value === true}
            onChange={(e) => { onChange(e.target.checked); onBlur?.(); }}
            disabled={disabled}
          />
        </Field>
      );
    case 'select': {
      const choices = selectChoices(field.options);
      return (
        <Field label={label} required={field.required} hint={field.helpText} error={error}>
          <Select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => { onChange(e.target.value); onBlur?.(); }}
            options={choices.map((c) => ({ value: c, label: humanize(c) }))}
            placeholder="Choose one"
            disabled={disabled}
          />
        </Field>
      );
    }
    case 'multiselect': {
      const choices = selectChoices(field.options);
      return (
        <Field label={label} required={field.required} hint={field.helpText} error={error}>
          <MultiSelect
            options={choices.map((c) => ({ value: c, label: humanize(c) }))}
            values={Array.isArray(value) ? (value as string[]) : []}
            onChange={(v) => { onChange(v); onBlur?.(); }}
            placeholder="Choose any that apply"
            disabled={disabled}
          />
        </Field>
      );
    }
    case 'clubs':
      return (
        <Field label={label} required={field.required} hint={field.helpText} error={error}>
          <MultiSelect
            options={clubOptions}
            values={Array.isArray(value) ? (value as string[]) : []}
            onChange={(v) => { onChange(v); onBlur?.(); }}
            placeholder="Search clubs"
            emptyText="No clubs found"
            disabled={disabled}
          />
        </Field>
      );
    case 'link':
      return (
        <div className="flex flex-col gap-1.5">
          {field.helpText && <p className="m-0 text-[11.5px] leading-snug text-fg-3">{field.helpText}</p>}
          <LinkFieldControl
            multiple={linkAllowsMultiple(field.options)}
            value={value}
            onChange={(v) => { onChange(v); onBlur?.(); }}
            label={field.required ? field.label : `${field.label} (optional)`}
            disabled={disabled}
          />
          {error && (
            <p role="alert" className="text-[11px] font-semibold leading-snug text-danger-fg">
              {error}
            </p>
          )}
        </div>
      );
    default:
      return null;
  }
}
