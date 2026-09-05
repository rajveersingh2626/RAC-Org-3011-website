import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { fetchClub } from '@/lib/clubs';
import { currentRyYear } from '@/lib/reports/month';
import { fetchClubFacts, updateClubFacts, type ClubFactsInput } from '@/lib/points/api';
import type { ClubFacts } from '@/lib/points/types';

type Draft = Omit<ClubFactsInput, 'ryYear'>;

function toDraft(facts: ClubFacts | null): Draft {
  return {
    duesPaidOn: facts?.duesPaidOn ?? null,
    riCitationCompleted: facts?.riCitationCompleted ?? false,
    paulHarrisFellows: facts?.paulHarrisFellows ?? 0,
    dualMembers: facts?.dualMembers ?? 0,
    mdioCommitteeMembers: facts?.mdioCommitteeMembers ?? 0,
    mdioEventsAttended: facts?.mdioEventsAttended ?? 0,
    sisterClubSignedOn: facts?.sisterClubSignedOn ?? null,
    drrVisitOn: facts?.drrVisitOn ?? null,
    vocationalCentreOn: facts?.vocationalCentreOn ?? null,
    activeSocialHandles: facts?.activeSocialHandles ?? 0,
    clubMerchandise: facts?.clubMerchandise ?? false,
    clubWebsiteUrl: facts?.clubWebsiteUrl ?? null,
    priorYearMemberCount: facts?.priorYearMemberCount ?? null,
  };
}

export function ClubFactsPage() {
  const { clubId = '' } = useParams<{ clubId: string }>();
  const qc = useQueryClient();
  const ryYear = currentRyYear();

  useDocumentMeta({ title: 'Club facts' });

  const clubQuery = useQuery({ queryKey: ['club', clubId], queryFn: () => fetchClub(clubId), enabled: Boolean(clubId) });
  const factsQuery = useQuery({
    queryKey: ['club-facts', clubId, ryYear],
    queryFn: () => fetchClubFacts(clubId, ryYear),
    enabled: Boolean(clubId),
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  useEffect(() => {
    if (factsQuery.data !== undefined) setDraft(toDraft(factsQuery.data));
  }, [factsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => updateClubFacts(clubId, { ryYear, ...(draft as Draft) }),
    onSuccess: (facts) => {
      qc.setQueryData(['club-facts', clubId, ryYear], facts);
    },
  });

  if (clubQuery.isPending || factsQuery.isPending || !draft) {
    return (
      <Container width="wide">
        <Skeleton shape="rect" className="h-96" />
      </Container>
    );
  }
  if (clubQuery.isError || factsQuery.isError) {
    return (
      <Container width="wide">
        <ErrorState title="Couldn't load club facts" onRetry={() => void factsQuery.refetch()} />
      </Container>
    );
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <Container width="wide">
      <Section
        eyebrow={`Club facts · ${clubQuery.data.name}`}
        title="A dozen slow-changing values the district holds, not the club"
        description="They drive points quietly, so they live on one screen with dates attached."
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card eyebrow="District obligations" className="flex flex-col gap-4">
            <Field label="Dues paid on" hint="Paid before 30 September to score full points">
              <DateInput value={draft.duesPaidOn ?? ''} onChange={(v) => set('duesPaidOn', v || null)} />
            </Field>
            <Field label="Sister-club agreement signed on">
              <DateInput value={draft.sisterClubSignedOn ?? ''} onChange={(v) => set('sisterClubSignedOn', v || null)} />
            </Field>
            <Field label="DRR official visit completed on">
              <DateInput value={draft.drrVisitOn ?? ''} onChange={(v) => set('drrVisitOn', v || null)} />
            </Field>
            <Field label="MDIO committee members">
              <Input
                type="number"
                min={0}
                value={draft.mdioCommitteeMembers}
                onChange={(e) => set('mdioCommitteeMembers', Number(e.target.value))}
              />
            </Field>
            <Field label="MDIO events attended">
              <Input
                type="number"
                min={0}
                value={draft.mdioEventsAttended}
                onChange={(e) => set('mdioEventsAttended', Number(e.target.value))}
              />
            </Field>
          </Card>

          <Card eyebrow="Recognition" className="flex flex-col gap-4">
            <Checkbox
              label="Rotary Citation completed"
              checked={draft.riCitationCompleted}
              onChange={(e) => set('riCitationCompleted', e.target.checked)}
            />
            <Field label="Paul Harris Fellows">
              <Input
                type="number"
                min={0}
                value={draft.paulHarrisFellows}
                onChange={(e) => set('paulHarrisFellows', Number(e.target.value))}
              />
            </Field>
            <Field label="Dual members">
              <Input type="number" min={0} value={draft.dualMembers} onChange={(e) => set('dualMembers', Number(e.target.value))} />
            </Field>
          </Card>

          <Card eyebrow="Public image & membership" className="flex flex-col gap-4 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Active social handles" hint="Counted monthly, capped at 5">
                <Input
                  type="number"
                  min={0}
                  value={draft.activeSocialHandles}
                  onChange={(e) => set('activeSocialHandles', Number(e.target.value))}
                />
              </Field>
              <Field label="Club website">
                <Input value={draft.clubWebsiteUrl ?? ''} onChange={(e) => set('clubWebsiteUrl', e.target.value || null)} />
              </Field>
              <Field label="Vocational centre set up on">
                <DateInput value={draft.vocationalCentreOn ?? ''} onChange={(v) => set('vocationalCentreOn', v || null)} />
              </Field>
              <Field label="Prior-year approved member count" hint="Baseline for the retention-ratio rule">
                <Input
                  type="number"
                  min={0}
                  value={draft.priorYearMemberCount ?? ''}
                  onChange={(e) => set('priorYearMemberCount', e.target.value === '' ? null : Number(e.target.value))}
                />
              </Field>
            </div>
            <Checkbox
              label="Club merchandise exists"
              checked={draft.clubMerchandise}
              onChange={(e) => set('clubMerchandise', e.target.checked)}
            />
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Save facts
          </Button>
        </div>
      </Section>
    </Container>
  );
}
