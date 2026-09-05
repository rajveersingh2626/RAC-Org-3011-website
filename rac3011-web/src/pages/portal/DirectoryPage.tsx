import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { fetchZones } from '@/lib/clubs';
import { acceptPrivacyPolicy, fetchDirectory, fetchSkillTags } from '@/lib/members/api';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Alert } from '@/components/ui/Alert';

function PrivacyGate({ onAccepted }: { onAccepted: () => void }) {
  const mutation = useMutation({
    mutationFn: acceptPrivacyPolicy,
    onSuccess: onAccepted,
  });
  return (
    <Card tone="dashed" className="text-center">
      <p className="m-0 mb-2 text-[15.5px] font-extrabold text-fg">Read the privacy policy first</p>
      <p className="m-0 mb-4 text-[13px] text-fg-2">
        The directory shows other members&apos; names, clubs and skills. Accept the privacy policy to browse
        it &ndash; you can read it before you do.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/privacy-policy" target="_blank" rel="noreferrer">
          <Button variant="secondary">Read the privacy policy</Button>
        </Link>
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
          I accept, show me the directory
        </Button>
      </div>
    </Card>
  );
}

export function DirectoryPage() {
  useDocumentMeta({ title: 'Member directory' });
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [zoneId, setZoneId] = useState('');

  const zonesQuery = useQuery({ queryKey: ['zones'], queryFn: fetchZones });
  const skillTagsQuery = useQuery({ queryKey: ['skill-tags'], queryFn: fetchSkillTags });
  const directoryQuery = useQuery({
    queryKey: ['directory', q, skill, zoneId],
    queryFn: () => fetchDirectory({ q: q || undefined, skill: skill || undefined, zoneId: zoneId || undefined }),
  });

  const privacyBlocked =
    directoryQuery.isError && directoryQuery.error instanceof ApiError && directoryQuery.error.code === 'PRIVACY_NOT_ACCEPTED';

  return (
    <Container width="wide">
      <Section
        eyebrow="Searchable by what people can do"
        title="District directory"
        description="Name, club, zone, skills and photograph &ndash; no contact details. Reach someone through their own club president."
      >
        {privacyBlocked ? (
          <PrivacyGate onAccepted={() => void qc.invalidateQueries({ queryKey: ['directory'] })} />
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                aria-label="Search the directory"
                placeholder="Search by name…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Select
                aria-label="Filter by skill"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Any skill"
                options={(skillTagsQuery.data ?? [])
                  .filter((t) => t.kind === 'skill')
                  .map((t) => ({ value: t.label, label: t.label }))}
              />
              <Select
                aria-label="Filter by zone"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                placeholder="Any zone"
                options={(zonesQuery.data ?? []).map((z) => ({ value: z.id, label: z.name }))}
              />
            </div>

            {directoryQuery.isPending ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} shape="rect" className="h-40" />
                ))}
              </div>
            ) : directoryQuery.isError ? (
              <ErrorState title="Couldn't load the directory" onRetry={() => void directoryQuery.refetch()} />
            ) : (directoryQuery.data?.items.length ?? 0) === 0 ? (
              <EmptyState title="No members match this search" body="Try a different skill or zone." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(directoryQuery.data?.items ?? []).map((m) => (
                  <Card key={m.id}>
                    <div className="flex items-start gap-3">
                      <Avatar name={m.fullName} src={m.photoUrl ?? undefined} size="lg" />
                      <div className="min-w-0">
                        <p className="m-0 text-[13.5px] font-extrabold text-fg">{m.fullName}</p>
                        <p className="m-0 text-[11.5px] text-fg-3">
                          {m.club.name}
                          {m.club.zoneName ? ` · ${m.club.zoneName}` : ''}
                        </p>
                      </div>
                    </div>
                    {(m.skills.length > 0 || m.interests.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {[...m.skills, ...m.interests].slice(0, 4).map((s) => (
                          <Chip key={s} label={s} />
                        ))}
                      </div>
                    )}
                    <p className="m-0 mt-3 text-[11.5px] font-bold text-accent">
                      Ask their president to introduce you &rarr;
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-6">
          <Alert tone="info" title="No contact details, deliberately">
            This shows name, club, zone, skills and photograph. Reaching someone goes through their own club
            president, not a phone number or email listed here.
          </Alert>
        </div>
      </Section>
    </Container>
  );
}
