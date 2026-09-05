import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { updateFixture } from '@/lib/rcl/api';
import type { Fixture, FixtureStatus } from '@/lib/rcl/types';
import { computeWinnerTeamId } from '@/lib/rcl/result';
import { ApiError } from '@/lib/api';

export interface FixtureResultModalProps {
  fixture: Fixture | null;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: FixtureStatus; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];

function initial(fixture: Fixture | null, key: 'homeRuns' | 'homeWickets' | 'awayRuns' | 'awayWickets'): string {
  return fixture?.result ? String(fixture.result[key]) : '';
}

export function FixtureResultModal({ fixture, onClose }: FixtureResultModalProps) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<FixtureStatus>(fixture?.status === 'abandoned' ? 'abandoned' : 'completed');
  const [homeRuns, setHomeRuns] = useState(initial(fixture, 'homeRuns'));
  const [homeWickets, setHomeWickets] = useState(initial(fixture, 'homeWickets'));
  const [homeOvers, setHomeOvers] = useState(fixture?.result ? String(fixture.result.homeOvers) : '');
  const [awayRuns, setAwayRuns] = useState(initial(fixture, 'awayRuns'));
  const [awayWickets, setAwayWickets] = useState(initial(fixture, 'awayWickets'));
  const [awayOvers, setAwayOvers] = useState(fixture?.result ? String(fixture.result.awayOvers) : '');
  const [notes, setNotes] = useState(fixture?.result?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function reset() {
    setStatus('completed');
    setHomeRuns('');
    setHomeWickets('');
    setHomeOvers('');
    setAwayRuns('');
    setAwayWickets('');
    setAwayOvers('');
    setNotes('');
    setErrors({});
    setFormError(null);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const [key, value] of [
      ['homeRuns', homeRuns],
      ['homeWickets', homeWickets],
      ['homeOvers', homeOvers],
      ['awayRuns', awayRuns],
      ['awayWickets', awayWickets],
      ['awayOvers', awayOvers],
    ] as const) {
      if (!value.trim() || Number.isNaN(Number(value)) || Number(value) < 0) next[key] = 'Enter a valid number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const mutation = useMutation({
    mutationFn: () => {
      const f = fixture!;
      const winnerTeamId = computeWinnerTeamId({
        status,
        homeRuns: Number(homeRuns),
        awayRuns: Number(awayRuns),
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
      });
      return updateFixture(f.id, {
        status,
        result: {
          homeRuns: Number(homeRuns),
          homeWickets: Number(homeWickets),
          homeOvers: Number(homeOvers),
          awayRuns: Number(awayRuns),
          awayWickets: Number(awayWickets),
          awayOvers: Number(awayOvers),
          winnerTeamId,
          notes: notes.trim() || null,
        },
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rcl', 'fixtures'] });
      reset();
      onClose();
    },
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not save this result.'),
  });

  const onSubmit = () => {
    setFormError(null);
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <Modal
      open={Boolean(fixture)}
      onClose={() => {
        reset();
        onClose();
      }}
      title={fixture ? `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}` : 'Enter result'}
      description="Points and NRR are computed by the league once a result is saved."
      size="lg"
      footer={
        <Button onClick={onSubmit} loading={mutation.isPending}>
          Save result
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {formError && (
          <Alert tone="error" title="Something went wrong">
            {formError}
          </Alert>
        )}

        <Field label="Result" required>
          <SegmentedControl label="Result" value={status} onChange={(v) => setStatus(v as FixtureStatus)} options={STATUS_OPTIONS} />
        </Field>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-3.5 rounded-[12px] border border-line-accent p-3.5">
            <p className="m-0 text-[12px] font-bold text-fg">{fixture?.homeTeam.name ?? 'Home team'}</p>
            <Field label="Runs" required error={errors.homeRuns}>
              <Input type="number" min={0} value={homeRuns} onChange={(e) => setHomeRuns(e.target.value)} />
            </Field>
            <Field label="Wickets" required error={errors.homeWickets}>
              <Input type="number" min={0} max={10} value={homeWickets} onChange={(e) => setHomeWickets(e.target.value)} />
            </Field>
            <Field label="Overs faced" required error={errors.homeOvers} hint="e.g. 19.4">
              <Input type="number" min={0} step={0.1} value={homeOvers} onChange={(e) => setHomeOvers(e.target.value)} />
            </Field>
          </div>
          <div className="flex flex-col gap-3.5 rounded-[12px] border border-line-accent p-3.5">
            <p className="m-0 text-[12px] font-bold text-fg">{fixture?.awayTeam.name ?? 'Away team'}</p>
            <Field label="Runs" required error={errors.awayRuns}>
              <Input type="number" min={0} value={awayRuns} onChange={(e) => setAwayRuns(e.target.value)} />
            </Field>
            <Field label="Wickets" required error={errors.awayWickets}>
              <Input type="number" min={0} max={10} value={awayWickets} onChange={(e) => setAwayWickets(e.target.value)} />
            </Field>
            <Field label="Overs faced" required error={errors.awayOvers} hint="e.g. 19.4">
              <Input type="number" min={0} step={0.1} value={awayOvers} onChange={(e) => setAwayOvers(e.target.value)} />
            </Field>
          </div>
        </div>

        <Field label="Notes" hint="Optional">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
        </Field>
      </div>
    </Modal>
  );
}
