import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { createFixture, fetchTeams } from '@/lib/rcl/api';
import { ApiError } from '@/lib/api';

export interface FixtureFormProps {
  season: number;
  onDone: () => void;
}

// datetime-local has no timezone info; treated as the browser's local time, matching how DateInput handles plain dates elsewhere.
function toIso(localValue: string): string {
  return new Date(localValue).toISOString();
}

export function FixtureForm({ season, onDone }: FixtureFormProps) {
  const qc = useQueryClient();
  const teamsQuery = useQuery({
    queryKey: ['rcl', 'teams', 'all', season],
    queryFn: () => fetchTeams({ season, pageSize: 200 }),
  });
  const teamOptions = (teamsQuery.data?.items ?? []).map((t) => ({ value: t.id, label: `${t.name} (${t.club.name})` }));

  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [venue, setVenue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!homeTeamId) next.homeTeamId = 'Pick the home team';
    if (!awayTeamId) next.awayTeamId = 'Pick the away team';
    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) next.awayTeamId = 'Home and away teams must be different';
    if (!scheduledAt) next.scheduledAt = 'Pick the date and time';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const mutation = useMutation({
    mutationFn: () =>
      createFixture({
        season,
        homeTeamId,
        awayTeamId,
        scheduledAt: toIso(scheduledAt),
        venue: venue.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rcl', 'fixtures'] });
      onDone();
    },
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not create this fixture.'),
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
        <Field label="Home team" required error={errors.homeTeamId}>
          <Select
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            placeholder={teamsQuery.isPending ? 'Loading teams…' : 'Choose a team'}
            options={teamOptions}
            disabled={teamsQuery.isPending}
          />
        </Field>
        <Field label="Away team" required error={errors.awayTeamId}>
          <Select
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            placeholder={teamsQuery.isPending ? 'Loading teams…' : 'Choose a team'}
            options={teamOptions}
            disabled={teamsQuery.isPending}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field label="Date and time" required error={errors.scheduledAt}>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </Field>
        <Field label="Venue" hint="Optional">
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={200} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={onSubmit} loading={mutation.isPending} disabled={teamsQuery.isPending}>
          Create fixture
        </Button>
      </div>
    </div>
  );
}
