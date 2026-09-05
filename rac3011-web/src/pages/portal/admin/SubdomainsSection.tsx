import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPublicClubs } from '@/lib/clubs';
import { updateSettings, type SettingsMap } from '@/lib/settings/api';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';

const PROJECT_KEYS = ['mission3011', 'drishti', 'rcl', 'careerbridge', 'ride'] as const;
const PROJECT_LABELS: Record<(typeof PROJECT_KEYS)[number], string> = {
  mission3011: 'Mission 3011',
  drishti: 'Drishti',
  rcl: 'RCL',
  careerbridge: 'Career Bridge',
  ride: 'RIDE',
};

function ProjectRow({ projectKey, settings }: { projectKey: (typeof PROJECT_KEYS)[number]; settings: SettingsMap }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const clubsQuery = useQuery({ queryKey: ['public-clubs-all'], queryFn: () => fetchPublicClubs() });

  const initialActive = settings[`subdomain.${projectKey}.active`] === true;
  const initialLeadClubId = settings[`subdomain.${projectKey}.leadClubId`];
  const [active, setActive] = useState(initialActive);
  const [leadClubId, setLeadClubId] = useState<string>(typeof initialLeadClubId === 'string' ? initialLeadClubId : '');

  const save = useMutation({
    mutationFn: (patch: SettingsMap) => updateSettings(patch),
    onSuccess: () => {
      toast({ title: `${PROJECT_LABELS[projectKey]} settings saved`, tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast({ title: 'Could not save', body: (err as Error).message, tone: 'error' }),
  });

  const isBidding = active && !leadClubId;

  return (
    <div className="flex flex-col gap-3 border-b border-line py-4 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[13.5px] font-bold text-fg">{PROJECT_LABELS[projectKey]}</p>
        {isBidding ? <Badge tone="amber">Open for bidding</Badge> : !active ? <Badge tone="neutral">Not started</Badge> : <Badge tone="green">Active</Badge>}
      </div>
      <Switch checked={active} onChange={setActive} label="Subdomain active" />
      <Field label="Lead club" hint="Leave unassigned to show as open for bidding.">
        {clubsQuery.isPending ? (
          <Skeleton shape="rect" className="h-11" />
        ) : (
          <Select
            value={leadClubId}
            onChange={(e) => setLeadClubId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned — open for bidding' },
              ...(clubsQuery.data ?? []).map((c) => ({ value: c.id, label: c.shortName || c.name })),
            ]}
          />
        )}
      </Field>
      <Button
        size="sm"
        className="self-start"
        loading={save.isPending}
        onClick={() =>
          save.mutate({
            [`subdomain.${projectKey}.active`]: active,
            [`subdomain.${projectKey}.leadClubId`]: leadClubId || null,
          })
        }
      >
        Save
      </Button>
    </div>
  );
}

export function SubdomainsSection({ settings }: { settings: SettingsMap }) {
  return (
    <Card eyebrow="Project subdomains" title="Subdomain assignment">
      <div className="mt-2 flex flex-col">
        {PROJECT_KEYS.map((key) => (
          <ProjectRow key={key} projectKey={key} settings={settings} />
        ))}
      </div>
    </Card>
  );
}
