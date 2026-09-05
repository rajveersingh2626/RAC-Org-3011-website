import { useQuery } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { RadialGauge } from '@/components/ui/RadialGauge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Table, type Column } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchMission3011Dashboard, type ClubUnits, type LatestApprovedCamp, type ZoneUnits } from '@/lib/publicApi/mission3011';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Mission3011DashboardPage() {
  useDocumentMeta({
    title: 'Mission 3011',
    description: 'Tracking the district-wide blood donation drive toward 3,011 units collected.',
  });

  const query = useQuery({ queryKey: ['public', 'mission3011', 'dashboard'], queryFn: fetchMission3011Dashboard });

  if (query.isPending) {
    return (
      <Container width="wide" className="py-10">
        <Skeleton shape="rect" className="h-64" />
      </Container>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Container width="wide" className="py-10">
        <ErrorState title="Couldn't load the Mission 3011 dashboard" onRetry={() => void query.refetch()} />
      </Container>
    );
  }

  const data = query.data;
  const maxZoneUnits = Math.max(1, ...data.byZone.map((z) => z.units));
  const campsApproved = data.perClub.reduce((sum, c) => sum + c.campsApproved, 0);

  const zoneColumns: Column<ZoneUnits>[] = [
    { key: 'zone', header: 'Zone', cell: (z) => <span className="font-bold text-fg">{z.zoneName}</span> },
    {
      key: 'units',
      header: 'Units',
      align: 'right',
      cell: (z) => (
        <div className="flex w-full min-w-[140px] items-center justify-end gap-3">
          <span className="tabular-nums text-fg-2">{z.units.toLocaleString('en-IN')}</span>
          <ProgressBar value={z.units} max={maxZoneUnits} size="sm" className="hidden max-w-[140px] sm:block" />
        </div>
      ),
    },
  ];

  const campColumns: Column<LatestApprovedCamp>[] = [
    {
      key: 'camp',
      header: 'Camp',
      cell: (c) => (
        <div>
          <p className="m-0 text-[13px] font-bold text-fg">{c.venue}</p>
          <p className="m-0 text-[11px] text-fg-3">
            {c.leadClub.name} · {formatDate(c.date)}
            {c.city ? ` · ${c.city}` : ''}
          </p>
        </div>
      ),
    },
    { key: 'units', header: 'Units', align: 'right', numeric: true, cell: (c) => c.unitsCollected.toLocaleString('en-IN') },
  ];

  const clubColumns: Column<ClubUnits>[] = [
    { key: 'club', header: 'Club', cell: (c) => <span className="font-bold text-fg">{c.clubName}</span> },
    { key: 'camps', header: 'Camps approved', align: 'right', numeric: true, cell: (c) => c.campsApproved },
    { key: 'units', header: 'Units', align: 'right', numeric: true, cell: (c) => c.unitsCollected.toLocaleString('en-IN') },
  ];

  return (
    <Container width="wide">
      <Section
        eyebrow="District flagship"
        title="Mission 3011"
        description="One unit at a time, toward 3,011 units of blood collected across the district this Rotary year."
      >
        <Card className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <RadialGauge
            size={168}
            value={data.totalUnits}
            max={data.target}
            label={data.totalUnits.toLocaleString('en-IN')}
            sublabel={`of ${data.target.toLocaleString('en-IN')} units`}
          />
          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3">
            <Stat label="Units collected" value={data.totalUnits.toLocaleString('en-IN')} />
            <Stat label="Target" value={data.target.toLocaleString('en-IN')} />
            <Stat label="Camps approved" value={campsApproved} />
            <Stat label="Zones reporting" value={data.byZone.length} />
            <Stat label="Clubs participating" value={data.perClub.length} />
          </div>
        </Card>
      </Section>

      <Section eyebrow="Where units are coming from" title="By zone">
        {data.byZone.length === 0 ? (
          <EmptyState title="No approved camps yet" body="Zone totals will appear as camps are logged and approved." />
        ) : (
          <Table columns={zoneColumns} rows={data.byZone} rowKey={(z) => z.zoneId ?? 'unassigned'} empty="No zones yet." />
        )}
      </Section>

      <Section eyebrow="Freshly approved" title="Latest approved camps">
        {data.latestApprovedCamps.length === 0 ? (
          <EmptyState title="No approved camps yet" body="Approved camps will show up here as soon as the district signs them off." />
        ) : (
          <Table columns={campColumns} rows={data.latestApprovedCamps} rowKey={(c) => c.id} empty="No camps yet." />
        )}
      </Section>

      <Section eyebrow="Club leaderboard" title="Per club">
        {data.perClub.length === 0 ? (
          <EmptyState title="No club totals yet" body="Once camps are approved, each club's running total shows up here." />
        ) : (
          <Table columns={clubColumns} rows={data.perClub} rowKey={(c) => c.clubId} empty="No clubs yet." />
        )}
      </Section>
    </Container>
  );
}
