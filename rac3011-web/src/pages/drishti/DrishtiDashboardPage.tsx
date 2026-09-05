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
import { fetchDrishtiDashboard, type DrishtiClubCount, type HospitalCount } from '@/lib/publicApi/drishti';
import { DRISHTI_STAGES, type DrishtiStage } from '@/lib/drishti/types';

const STAGE_LABEL: Record<DrishtiStage, string> = {
  screened: 'Screened',
  scheduled: 'Scheduled',
  operated: 'Operated',
  followup: 'Follow-up',
  closed: 'Closed',
};

export function DrishtiDashboardPage() {
  useDocumentMeta({
    title: 'Project Drishti',
    description: 'Tracking cataract screening and surgery progress toward the 100-surgery target.',
  });

  const query = useQuery({ queryKey: ['public', 'drishti', 'dashboard'], queryFn: fetchDrishtiDashboard });

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
        <ErrorState title="Couldn't load the Project Drishti dashboard" onRetry={() => void query.refetch()} />
      </Container>
    );
  }

  const data = query.data;
  const maxPipeline = Math.max(1, ...DRISHTI_STAGES.map((s) => data.pipelineCounts[s] ?? 0));

  const hospitalColumns: Column<HospitalCount>[] = [
    { key: 'hospital', header: 'Hospital', cell: (h) => <span className="font-bold text-fg">{h.hospital}</span> },
    { key: 'surgeries', header: 'Surgeries', align: 'right', numeric: true, cell: (h) => h.surgeries },
  ];

  const clubColumns: Column<DrishtiClubCount>[] = [
    { key: 'club', header: 'Club', cell: (c) => <span className="font-bold text-fg">{c.clubName}</span> },
    { key: 'beneficiaries', header: 'Patients screened', align: 'right', numeric: true, cell: (c) => c.beneficiaries },
    { key: 'operated', header: 'Operated', align: 'right', numeric: true, cell: (c) => c.operated },
  ];

  return (
    <Container width="wide">
      <Section
        eyebrow="District flagship"
        title="Project Drishti"
        description="Restoring sight, one surgery at a time, toward 100 cataract surgeries this Rotary year."
      >
        <Card className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <RadialGauge
            size={168}
            value={data.operatedCount}
            max={data.target}
            label={data.operatedCount.toLocaleString('en-IN')}
            sublabel={`of ${data.target.toLocaleString('en-IN')} surgeries`}
          />
          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3">
            <Stat label="Surgeries completed" value={data.operatedCount} />
            <Stat label="Target" value={data.target} />
            <Stat label="In pipeline" value={data.pipelineCounts.screened + data.pipelineCounts.scheduled} />
            <Stat label="Partner hospitals" value={data.hospitals.length} />
            <Stat label="Clubs participating" value={data.perClub.length} />
          </div>
        </Card>
      </Section>

      <Section eyebrow="Where patients stand" title="Pipeline">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DRISHTI_STAGES.map((stage) => (
            <Card key={stage}>
              <ProgressBar
                value={data.pipelineCounts[stage] ?? 0}
                max={maxPipeline}
                label={STAGE_LABEL[stage]}
                hint={String(data.pipelineCounts[stage] ?? 0)}
              />
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Partner network" title="Hospitals">
        {data.hospitals.length === 0 ? (
          <EmptyState title="No surgeries recorded yet" body="Partner hospitals will show up here once surgeries are logged." />
        ) : (
          <Table columns={hospitalColumns} rows={data.hospitals} rowKey={(h) => h.hospital} empty="No hospitals yet." />
        )}
      </Section>

      <Section eyebrow="Club leaderboard" title="Per club">
        {data.perClub.length === 0 ? (
          <EmptyState title="No club totals yet" body="Once patients are screened, each club's running total shows up here." />
        ) : (
          <Table columns={clubColumns} rows={data.perClub} rowKey={(c) => c.clubId} empty="No clubs yet." />
        )}
      </Section>
    </Container>
  );
}
