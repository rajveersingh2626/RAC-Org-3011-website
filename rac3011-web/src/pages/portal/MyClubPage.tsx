import { useQuery } from '@tanstack/react-query';
import { fetchMyClub } from '@/lib/members/api';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { KeyValue } from '@/components/ui/KeyValue';
import { Stat } from '@/components/ui/Stat';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function MyClubPage() {
  useDocumentMeta({ title: 'My club' });
  const clubQuery = useQuery({ queryKey: ['me', 'club'], queryFn: fetchMyClub });

  return (
    <Container width="wide">
      <Section eyebrow="Your club" title={clubQuery.data?.name ?? 'My club'} description="Contact details and current officers.">
        {clubQuery.isPending ? (
          <Skeleton shape="rect" className="h-48" />
        ) : clubQuery.isError ? (
          <ErrorState title="Couldn't load your club" onRetry={() => void clubQuery.refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
            <Card>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <Stat label="Members" value={clubQuery.data.memberCount} />
              </div>
              <KeyValue
                items={[
                  { label: 'Club', value: clubQuery.data.name },
                  { label: 'Phone', value: clubQuery.data.phone ?? 'Not on file' },
                  { label: 'Email', value: clubQuery.data.email ?? 'Not on file' },
                  { label: 'Meetings', value: clubQuery.data.meetingInfo ?? 'Not on file' },
                ]}
              />
            </Card>
            <Card>
              <p className="m-0 mb-3 text-[10.5px] font-bold tracking-[1px] text-fg-3">CURRENT OFFICERS</p>
              {(clubQuery.data.board ?? []).length === 0 ? (
                <p className="m-0 text-[12.5px] text-fg-3">No officers on file for this Rotary year yet.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {(clubQuery.data.board ?? []).map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0">
                      <span className="text-[12.5px] font-bold text-fg">{b.name}</span>
                      <span className="text-[11.5px] text-fg-3">{b.position}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </Section>
    </Container>
  );
}
