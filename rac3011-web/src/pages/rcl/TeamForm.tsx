import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Combobox } from '@/components/ui/Combobox';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { fetchMembers } from '@/lib/members/api';
import { createTeam, updateTeam, type PlayerInput } from '@/lib/rcl/api';
import type { Team } from '@/lib/rcl/types';
import { canAddPlayer, MAX_ROSTER_SIZE, rosterError } from '@/lib/rcl/roster';
import { ApiError } from '@/lib/api';

export interface TeamFormProps {
  mode: 'create' | 'edit';
  clubId: string;
  season: number;
  team?: Team;
  onDone: () => void;
}

interface PlayerRow {
  key: string;
  memberId: string | null;
  name: string;
  role: string;
}

let rowSeq = 0;
function emptyRow(): PlayerRow {
  rowSeq += 1;
  return { key: `row_${rowSeq}`, memberId: null, name: '', role: '' };
}

export function TeamForm({ mode, clubId, season, team, onDone }: TeamFormProps) {
  const qc = useQueryClient();
  const membersQuery = useQuery({
    queryKey: ['rcl', 'club-members', clubId],
    queryFn: () => fetchMembers({ clubId, status: 'approved', pageSize: 200 }),
  });
  const memberOptions = (membersQuery.data?.items ?? []).map((m) => ({ value: m.id, label: m.fullName }));

  const [name, setName] = useState(team?.name ?? '');
  const [captainName, setCaptainName] = useState(team?.captainName ?? '');
  const [captainPhone, setCaptainPhone] = useState(team?.captainPhone ?? '');
  const [players, setPlayers] = useState<PlayerRow[]>(() => {
    if (team && team.players.length > 0) {
      return team.players.map((p) => {
        rowSeq += 1;
        return { key: `row_${rowSeq}`, memberId: p.memberId, name: p.name, role: p.role ?? '' };
      });
    }
    return [emptyRow()];
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function updatePlayer(key: string, patch: Partial<PlayerRow>) {
    setPlayers((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function removePlayer(key: string) {
    setPlayers((prev) => prev.filter((p) => p.key !== key));
  }

  function addPlayer() {
    setPlayers((prev) => (canAddPlayer(prev.length) ? [...prev, emptyRow()] : prev));
  }

  function buildPlayers(): PlayerInput[] {
    return players.map((p) => ({ name: p.name.trim(), role: p.role.trim() || null, memberId: p.memberId || null }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter the team name';
    if (!captainName.trim()) next.captainName = "Enter the captain's name";
    if (!captainPhone.trim()) next.captainPhone = "Enter the captain's phone number";
    const roster = rosterError(players.map((p) => ({ name: p.name })));
    if (roster) next.roster = roster;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['rcl', 'teams'] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createTeam({
        season,
        clubId,
        name: name.trim(),
        captainName: captainName.trim(),
        captainPhone: captainPhone.trim(),
        players: buildPlayers(),
      }),
    onSuccess: () => {
      invalidate();
      onDone();
    },
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not register this team. Try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateTeam(team!.id, {
        name: name.trim(),
        captainName: captainName.trim(),
        captainPhone: captainPhone.trim(),
        players: buildPlayers(),
      }),
    onSuccess: () => {
      invalidate();
      onDone();
    },
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not save your changes.'),
  });

  const onSubmit = () => {
    setFormError(null);
    if (!validate()) return;
    if (mode === 'create') createMutation.mutate();
    else updateMutation.mutate();
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
        <Field label="Team name" required error={errors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Delhi South East Strikers" maxLength={120} />
        </Field>
        <div />
        <Field label="Captain name" required error={errors.captainName}>
          <Input value={captainName} onChange={(e) => setCaptainName(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Captain phone" required error={errors.captainPhone}>
          <Input type="tel" value={captainPhone} onChange={(e) => setCaptainPhone(e.target.value)} maxLength={20} />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="m-0 text-[12px] font-bold text-fg">
            Roster <span className="font-normal text-fg-3">({players.length} / {MAX_ROSTER_SIZE})</span>
          </p>
          <Button size="sm" variant="secondary" onClick={addPlayer} disabled={!canAddPlayer(players.length)}>
            Add player
          </Button>
        </div>
        {errors.roster ? (
          <p role="alert" className="mb-2 text-[11px] font-semibold text-danger-fg">
            {errors.roster}
          </p>
        ) : null}
        <div className="flex flex-col gap-2.5">
          {players.map((p, i) => (
            <div key={p.key} className="grid grid-cols-1 items-end gap-2.5 rounded-[10px] border border-line p-2.5 sm:grid-cols-[2fr_1.5fr_2fr_auto]">
              <Field label={`Player ${i + 1} name`} required>
                <Input value={p.name} onChange={(e) => updatePlayer(p.key, { name: e.target.value })} maxLength={120} />
              </Field>
              <Field label="Role" hint="Optional">
                <Input value={p.role} onChange={(e) => updatePlayer(p.key, { role: e.target.value })} placeholder="Batter, bowler…" maxLength={60} />
              </Field>
              <Field label="Link to a member" hint="Optional">
                <Combobox
                  options={memberOptions}
                  value={p.memberId}
                  onChange={(v) => updatePlayer(p.key, { memberId: v })}
                  placeholder={membersQuery.isPending ? 'Loading members…' : 'Search club members…'}
                  disabled={membersQuery.isPending}
                />
              </Field>
              <IconButton
                label={`Remove player ${i + 1}`}
                onClick={() => removePlayer(p.key)}
                disabled={players.length === 1}
                className="justify-self-start sm:justify-self-center"
              >
                <Trash2 />
              </IconButton>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={onSubmit} loading={busy} disabled={busy}>
          {mode === 'create' ? 'Register this team' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
