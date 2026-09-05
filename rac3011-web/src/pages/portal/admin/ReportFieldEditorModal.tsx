import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { TagInput } from '@/components/ui/TagInput';
import { Button } from '@/components/ui/Button';
import type { ReportFieldInput } from '@/lib/reports/api';
import type { ReportFieldType } from '@/lib/reports/types';
import { selectChoices, linkAllowsMultiple } from '@/lib/reports/values';

const FIELD_TYPES: { value: ReportFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select one' },
  { value: 'multiselect', label: 'Select many' },
  { value: 'link', label: 'Link / photo' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes / no' },
  { value: 'clubs', label: 'Clubs' },
];

export interface ReportFieldEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (field: ReportFieldInput) => void;
  initial: ReportFieldInput | null;
  nextOrder: number;
}

const BLANK: ReportFieldInput = {
  section: 'Monthly activity log',
  fieldKey: '',
  label: '',
  type: 'text',
  required: false,
  perActivity: true,
  order: 0,
  helpText: null,
  pointSourceKey: null,
};

export function ReportFieldEditorModal({ open, onClose, onSave, initial, nextOrder }: ReportFieldEditorModalProps) {
  const [draft, setDraft] = useState<ReportFieldInput>(initial ?? { ...BLANK, order: nextOrder });
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const set = <K extends keyof ReportFieldInput>(key: K, value: ReportFieldInput[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const choices = selectChoices(draft.options);
  const multiple = linkAllowsMultiple(draft.options);
  const needsChoices = draft.type === 'select' || draft.type === 'multiselect';

  const save = () => {
    if (!/^[a-z][a-z0-9_]*$/.test(draft.fieldKey)) {
      setError('Field key must be lowercase snake_case, e.g. activity_title');
      return;
    }
    if (!draft.label.trim()) {
      setError('Give the field a label');
      return;
    }
    onSave(draft);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit field' : 'Add a field'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save field</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-left">
        {error && <p className="m-0 text-[12px] font-semibold text-danger-fg">{error}</p>}
        <Field label="Label">
          <Input value={draft.label} onChange={(e) => set('label', e.target.value)} />
        </Field>
        <Field label="Field key" hint="Lowercase snake_case, used in the stored data">
          <Input value={draft.fieldKey} onChange={(e) => set('fieldKey', e.target.value.trim())} disabled={Boolean(initial)} />
        </Field>
        <Field label="Section">
          <Input value={draft.section} onChange={(e) => set('section', e.target.value)} />
        </Field>
        <Field label="Type">
          <Select
            value={draft.type}
            onChange={(e) => set('type', e.target.value as ReportFieldType)}
            options={FIELD_TYPES}
          />
        </Field>
        {needsChoices && (
          <Field label="Choices">
            <TagInput values={choices} onChange={(v) => set('options', { choices: v })} placeholder="Type a choice and press Enter" />
          </Field>
        )}
        {draft.type === 'link' && (
          <Checkbox label="Allow more than one link" checked={multiple} onChange={(e) => set('options', { multiple: e.target.checked })} />
        )}
        <Checkbox label="Required" checked={draft.required ?? false} onChange={(e) => set('required', e.target.checked)} />
        <Checkbox
          label="One value per activity (not once per month)"
          checked={draft.perActivity ?? false}
          onChange={(e) => set('perActivity', e.target.checked)}
        />
        <Field label="Help text" hint="Optional">
          <Textarea rows={2} value={draft.helpText ?? ''} onChange={(e) => set('helpText', e.target.value || null)} />
        </Field>
        <Field label="Point source key" hint="Optional — links this field to the points engine">
          <Input value={draft.pointSourceKey ?? ''} onChange={(e) => set('pointSourceKey', e.target.value || null)} />
        </Field>
      </div>
    </Modal>
  );
}
