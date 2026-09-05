import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { fetchMembers } from '@/lib/members/api';
import { upsertSupportClub } from '@/lib/ride/api';
import type { SupportClub } from '@/lib/ride/types';
import { ApiError } from '@/lib/api';

const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export interface SupportClubFormProps {
  clubId: string;
  supportClub?: SupportClub;
  onDone: () => void;
}

export function SupportClubForm({ clubId, supportClub, onDone }: SupportClubFormProps) {
  const qc = useQueryClient();
  const membersQuery = useQuery({
    queryKey: ['ride', 'club-members', clubId],
    queryFn: () => fetchMembers({ clubId, status: 'approved', pageSize: 200 }),
  });
  const memberOptions = (membersQuery.data?.items ?? []).map((m) => ({ value: m.id, label: m.fullName }));

  const [capacityDelegates, setCapacityDelegates] = useState(
    supportClub ? String(supportClub.capacityDelegates) : '',
  );
  const [homestayAvailable, setHomestayAvailable] = useState(supportClub?.homestayAvailable ?? false);
  const [preferredMonths, setPreferredMonths] = useState<string[]>(
    supportClub?.preferredMonths.map(String) ?? [],
  );
  const [contactMemberId, setContactMemberId] = useState<string | null>(supportClub?.contactMemberId ?? null);
  const [contactPhone, setContactPhone] = useState(supportClub?.contactPhone ?? '');
  const [notes, setNotes] = useState(supportClub?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!capacityDelegates.trim() || Number(capacityDelegates) < 1 || !Number.isInteger(Number(capacityDelegates))) {
      next.capacityDelegates = 'Enter how many delegates you can host as a whole number';
    }
    if (!contactPhone.trim()) next.contactPhone = "Enter a contact phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const mutation = useMutation({
    mutationFn: () =>
      upsertSupportClub({
        capacityDelegates: Number(capacityDelegates),
        homestayAvailable,
        preferredMonths: preferredMonths.map(Number),
        contactMemberId,
        contactPhone: contactPhone.trim(),
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ride', 'support-clubs'] });
      onDone();
    },
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not save your registration. Try again.'),
  });

  const onSubmit = () => {
    setFormError(null);
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <div className="flex flex-col gap-4">
      {formError && (
        <Alert tone="error" title="Something went wrong">
          {formError}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Delegates you can host" required error={errors.capacityDelegates} hint="At a time, across a homestay or shared arrangement">
          <Input type="number" min={1} value={capacityDelegates} onChange={(e) => setCapacityDelegates(e.target.value)} />
        </Field>
        <Field label="Contact phone" required error={errors.contactPhone}>
          <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={30} />
        </Field>
      </div>

      <Field label="Homestay available">
        <Switch
          checked={homestayAvailable}
          onChange={setHomestayAvailable}
          label="We can host delegates in members' homes"
        />
      </Field>

      <Field label="Preferred months" hint="Optional — when your club is best placed to host">
        <MultiSelect
          options={MONTH_OPTIONS}
          values={preferredMonths}
          onChange={setPreferredMonths}
          placeholder="Any month works"
          label="Preferred months"
        />
      </Field>

      <Field label="Point of contact" hint="Optional — a specific member coordinating this">
        <Select
          value={contactMemberId ?? ''}
          onChange={(e) => setContactMemberId(e.target.value || null)}
          placeholder={membersQuery.isPending ? 'Loading members…' : 'No specific member'}
          disabled={membersQuery.isPending}
          options={memberOptions}
        />
      </Field>

      <Field label="Notes" hint="Optional — anything the district office should know">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} />
      </Field>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={onSubmit} loading={mutation.isPending} disabled={mutation.isPending}>
          {supportClub ? 'Save changes' : 'Register as a support club'}
        </Button>
      </div>
    </div>
  );
}
