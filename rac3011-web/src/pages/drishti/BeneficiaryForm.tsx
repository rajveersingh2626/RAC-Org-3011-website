import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Select } from '@/components/ui/Select';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { fetchPublicClubs } from '@/lib/clubs';
import { createBeneficiary } from '@/lib/drishti/api';
import type { Eye } from '@/lib/drishti/types';
import { ApiError } from '@/lib/api';

const EYE_OPTIONS: { value: Eye; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both' },
];

export interface BeneficiaryFormProps {
  canPickClub: boolean;
  onDone: () => void;
}

export function BeneficiaryForm({ canPickClub, onDone }: BeneficiaryFormProps) {
  const clubsQuery = useQuery({ queryKey: ['public-clubs'], queryFn: () => fetchPublicClubs(), enabled: canPickClub });
  const clubOptions = (clubsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  const [clubId, setClubId] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [eye, setEye] = useState<Eye>('both');
  const [screenedOn, setScreenedOn] = useState('');
  const [campLocation, setCampLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter the patient's name";
    if (!screenedOn) next.screenedOn = 'Pick the screening date';
    if (canPickClub && !clubId) next.clubId = 'Pick the club running this screening';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createBeneficiary({
        name: name.trim(),
        age: age ? Number(age) : null,
        gender: gender.trim() || null,
        phone: phone.trim() || null,
        eye,
        screenedOn,
        campLocation: campLocation.trim() || null,
        notes: notes.trim() || null,
        clubId: canPickClub ? clubId : undefined,
      }),
    onSuccess: onDone,
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not log this patient. Try again.'),
  });

  const onSubmit = () => {
    setFormError(null);
    if (!validate()) return;
    createMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-4">
      {formError && (
        <Alert tone="error" title="Something went wrong">
          {formError}
        </Alert>
      )}

      {canPickClub ? (
        <Field label="Club" required error={errors.clubId}>
          <Select value={clubId} onChange={(e) => setClubId(e.target.value)} placeholder="Choose a club" options={clubOptions} />
        </Field>
      ) : null}

      <Field label="Patient name" required error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
      </Field>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Age" hint="Optional">
          <Input type="number" min={0} max={130} value={age} onChange={(e) => setAge(e.target.value)} />
        </Field>
        <Field label="Gender" hint="Optional">
          <Input value={gender} onChange={(e) => setGender(e.target.value)} maxLength={30} />
        </Field>
      </div>

      <Field label="Phone" hint="Optional — used for follow-up only">
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
      </Field>

      <Field label="Eye" required>
        <SegmentedControl label="Eye" value={eye} onChange={(v) => setEye(v as Eye)} options={EYE_OPTIONS} />
      </Field>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Screened on" required error={errors.screenedOn}>
          <DateInput value={screenedOn} onChange={setScreenedOn} />
        </Field>
        <Field label="Camp location" hint="Optional">
          <Input value={campLocation} onChange={(e) => setCampLocation(e.target.value)} maxLength={200} />
        </Field>
      </div>

      <Field label="Notes" hint="Optional">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={3000} />
      </Field>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={onSubmit} loading={createMutation.isPending} disabled={createMutation.isPending}>
          Log this patient
        </Button>
      </div>
    </div>
  );
}
