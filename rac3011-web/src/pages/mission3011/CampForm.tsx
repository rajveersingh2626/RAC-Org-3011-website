import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { FileUpload, type FileUploadValue } from '@/components/ui/FileUpload';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { fetchPublicClubs } from '@/lib/clubs';
import { createCamp, updateCamp } from '@/lib/mission3011/api';
import type { Camp } from '@/lib/mission3011/types';
import { ApiError } from '@/lib/api';

const PHOTO_SLOTS = 3;

function urlOf(value: FileUploadValue | null): string | null {
  if (!value) return null;
  return value.kind === 'file' ? value.file.url : value.url;
}

function linksToValues(links: string[]): (FileUploadValue | null)[] {
  const values: (FileUploadValue | null)[] = links.map((url) => ({ kind: 'link', url }));
  while (values.length < PHOTO_SLOTS) values.push(null);
  return values;
}

export interface CampFormProps {
  mode: 'create' | 'edit';
  clubId: string;
  camp?: Camp;
  onDone: () => void;
}

export function CampForm({ mode, clubId, camp, onDone }: CampFormProps) {
  const clubsQuery = useQuery({ queryKey: ['public-clubs'], queryFn: () => fetchPublicClubs() });
  const clubOptions = (clubsQuery.data ?? [])
    .filter((c) => c.id !== clubId)
    .map((c) => ({ value: c.id, label: c.name }));

  const [date, setDate] = useState(camp?.date.slice(0, 10) ?? '');
  const [venue, setVenue] = useState(camp?.venue ?? '');
  const [city, setCity] = useState(camp?.city ?? '');
  const [unitsCollected, setUnitsCollected] = useState(camp ? String(camp.unitsCollected) : '');
  const [donorsRegistered, setDonorsRegistered] = useState(camp?.donorsRegistered != null ? String(camp.donorsRegistered) : '');
  const [partnerBloodBank, setPartnerBloodBank] = useState(camp?.partnerBloodBank ?? '');
  const [participatingClubIds, setParticipatingClubIds] = useState<string[]>(
    camp?.participatingClubs.map((c) => c.id) ?? [],
  );
  const [photos, setPhotos] = useState<(FileUploadValue | null)[]>(linksToValues(camp?.photos ?? []));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const buildPayload = () => ({
    date,
    venue: venue.trim(),
    city: city.trim() || null,
    unitsCollected: Number(unitsCollected),
    donorsRegistered: donorsRegistered ? Number(donorsRegistered) : null,
    partnerBloodBank: partnerBloodBank.trim() || null,
    photos: photos.map(urlOf).filter((u): u is string => Boolean(u)),
    participatingClubIds,
  });

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!date) next.date = 'Pick the camp date';
    if (!venue.trim()) next.venue = 'Say where the camp was held';
    if (!unitsCollected.trim() || Number(unitsCollected) < 0 || !Number.isInteger(Number(unitsCollected))) {
      next.unitsCollected = 'Enter the units collected as a whole number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const createMutation = useMutation({
    mutationFn: () => createCamp(buildPayload()),
    onSuccess: onDone,
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not log this camp. Try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateCamp(camp!.id, buildPayload()),
    onSuccess: onDone,
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not save your changes.'),
  });

  const onSubmit = () => {
    setFormError(null);
    if (!validate()) return;
    if (mode === 'create') createMutation.mutate();
    else updateMutation.mutate();
  };

  const setPhoto = (index: number, value: FileUploadValue | null) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? value : p)));
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      {formError && (
        <Alert tone="error" title="Something went wrong">
          {formError}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Date" required error={errors.date}>
          <DateInput value={date} onChange={setDate} />
        </Field>
        <Field label="Venue" required error={errors.venue}>
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="College auditorium, community hall…" maxLength={200} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="City" hint="Optional">
          <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Partner blood bank" hint="Optional">
          <Input value={partnerBloodBank} onChange={(e) => setPartnerBloodBank(e.target.value)} maxLength={200} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Units collected" required error={errors.unitsCollected}>
          <Input type="number" min={0} value={unitsCollected} onChange={(e) => setUnitsCollected(e.target.value)} />
        </Field>
        <Field label="Donors registered" hint="Optional">
          <Input type="number" min={0} value={donorsRegistered} onChange={(e) => setDonorsRegistered(e.target.value)} />
        </Field>
      </div>

      <Field label="Participating clubs" hint="Optional — other clubs that helped run this camp">
        <MultiSelect options={clubOptions} values={participatingClubIds} onChange={setParticipatingClubIds} placeholder="Search clubs…" />
      </Field>

      <Field label="Photos" hint="Upload files, or paste a Drive/Photos link.">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {photos.map((value, i) => (
            <FileUpload
              key={i}
              tier="dynamic"
              resourceType="camp_photo"
              resourceId={clubId || undefined}
              value={value}
              onChange={(v) => setPhoto(i, v)}
              label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      </Field>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={onSubmit} loading={busy} disabled={busy}>
          {mode === 'create' ? 'Log this camp' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
