import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ComboboxOption } from '@/components/ui/Combobox';
import type { ReportField } from '@/lib/reports/types';
import { ReportFieldControl } from './ReportFieldControl';

export interface ActivityFormProps {
  fields: ReportField[];
  activity: Record<string, unknown>;
  index: number;
  clubOptions: ComboboxOption[];
  onSave: (activity: Record<string, unknown>) => void;
  onCancel?: () => void;
}

function validate(fields: ReportField[], activity: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!field.required) continue;
    const v = activity[field.fieldKey];
    if (v === undefined || v === null || v === '') errors[field.fieldKey] = `${field.label} is required`;
  }
  return errors;
}

export function ActivityForm({ fields, activity, index, clubOptions, onSave, onCancel }: ActivityFormProps) {
  const [draft, setDraft] = useState(activity);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (key: string, value: unknown) => setDraft((d) => ({ ...d, [key]: value }));

  const save = (andAddAnother: boolean) => {
    const nextErrors = validate(fields, draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(draft);
    if (!andAddAnother) return;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3.5">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Activity {index + 1}</p>
        <div aria-hidden className="h-px flex-1 bg-line" />
      </div>
      {fields.map((field) => (
        <ReportFieldControl
          key={field.id}
          field={field}
          value={draft[field.fieldKey]}
          onChange={(v) => setField(field.fieldKey, v)}
          error={errors[field.fieldKey]}
          clubOptions={clubOptions}
        />
      ))}
      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <Button type="button" onClick={() => save(true)}>
          Save this activity, add another
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
