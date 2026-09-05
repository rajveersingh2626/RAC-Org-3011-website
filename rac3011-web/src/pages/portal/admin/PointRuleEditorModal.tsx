import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Plus, Trash2 } from 'lucide-react';
import type { PointCategory, PointRule, RulePeriod, RuleType, SourceType, Tier } from '@/lib/points/types';
import type { PointRuleInput } from '@/lib/points/api';

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'per_unit', label: 'Per unit' },
  { value: 'tiered', label: 'Tiered' },
  { value: 'penalty', label: 'Penalty' },
];
const PERIODS: { value: RulePeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'once', label: 'One-time' },
];
const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'report_field', label: 'report_field' },
  { value: 'club_fact', label: 'club_fact' },
  { value: 'event_attendance', label: 'event_attendance' },
  { value: 'project_collaboration', label: 'project_collaboration' },
  { value: 'ride_hosting', label: 'ride_hosting' },
  { value: 'club_events', label: 'club_events' },
];

export type PointRuleFormValues = PointRuleInput & { isActive: boolean };

export interface PointRuleEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: PointRuleFormValues) => void;
  saving: boolean;
  categories: PointCategory[];
  ryYear: number;
  initial: PointRule | null;
}

function blank(categories: PointCategory[], ryYear: number): PointRuleInput {
  return {
    categoryId: categories[0]?.id ?? '',
    key: '',
    label: '',
    ruleType: 'flat',
    period: 'monthly',
    sourceType: 'report_field',
    sourceKey: '',
    points: 0,
    perUnitCap: null,
    ryYear,
    tiers: [],
  };
}

export function PointRuleEditorModal({ open, onClose, onSave, saving, categories, ryYear, initial }: PointRuleEditorModalProps) {
  const [draft, setDraft] = useState<PointRuleInput>(initial ?? blank(categories, ryYear));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  if (!open) return null;

  const set = <K extends keyof PointRuleInput>(key: K, value: PointRuleInput[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const tiers = draft.tiers ?? [];
  const setTier = (i: number, patch: Partial<Tier>) =>
    set('tiers', tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const addTier = () => set('tiers', [...tiers, { min: 0, max: null, points: 0 }]);
  const removeTier = (i: number) => set('tiers', tiers.filter((_, idx) => idx !== i));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={initial ? `Edit ${initial.label}` : 'New point rule'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => onSave({ ...draft, isActive })}>
            Save rule
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={draft.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Label">
            <Input value={draft.label} onChange={(e) => set('label', e.target.value)} />
          </Field>
          <Field label="Rule key" hint="Immutable once created">
            <Input value={draft.key} disabled={Boolean(initial)} onChange={(e) => set('key', e.target.value.trim())} />
          </Field>
          <Field label="Rule type">
            <Select value={draft.ruleType} onChange={(e) => set('ruleType', e.target.value as RuleType)} options={RULE_TYPES} />
          </Field>
          <Field label="Period">
            <Select value={draft.period} onChange={(e) => set('period', e.target.value as RulePeriod)} options={PERIODS} />
          </Field>
          <Field label="Source type">
            <Select value={draft.sourceType} onChange={(e) => set('sourceType', e.target.value as SourceType)} options={SOURCE_TYPES} />
          </Field>
          <Field label="Source key">
            <Input value={draft.sourceKey} onChange={(e) => set('sourceKey', e.target.value.trim())} />
          </Field>
          {draft.ruleType !== 'tiered' && (
            <Field label="Points" hint={draft.ruleType === 'per_unit' ? 'Points per unit' : undefined}>
              <Input
                type="number"
                value={draft.points ?? 0}
                onChange={(e) => set('points', Number(e.target.value))}
              />
            </Field>
          )}
          {draft.ruleType === 'per_unit' && (
            <Field label="Per-unit cap" hint="Blank = uncapped">
              <Input
                type="number"
                min={1}
                value={draft.perUnitCap ?? ''}
                onChange={(e) => set('perUnitCap', e.target.value === '' ? null : Number(e.target.value))}
              />
            </Field>
          )}
        </div>

        {draft.ruleType === 'tiered' && (
          <div>
            <p className="m-0 mb-2 text-[11.5px] font-bold text-fg-3">Tiers (inclusive min, exclusive max)</p>
            <div className="flex flex-col gap-2">
              {tiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                  <Input type="number" aria-label="Min" value={tier.min} onChange={(e) => setTier(i, { min: Number(e.target.value) })} />
                  <Input
                    type="number"
                    aria-label="Max"
                    placeholder="No max"
                    value={tier.max ?? ''}
                    onChange={(e) => setTier(i, { max: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    aria-label="Points"
                    value={tier.points}
                    onChange={(e) => setTier(i, { points: Number(e.target.value) })}
                  />
                  <IconButton label="Remove tier" onClick={() => removeTier(i)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              ))}
              <Button variant="ghost" size="sm" leading={<Plus size={14} />} onClick={addTier}>
                Add tier
              </Button>
            </div>
          </div>
        )}

        <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </div>
    </Modal>
  );
}
