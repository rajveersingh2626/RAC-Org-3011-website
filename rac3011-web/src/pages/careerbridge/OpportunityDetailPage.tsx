import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchListing } from '@/lib/publicApi/careerbridge';
import type { ListingType } from '@/lib/careerbridge/types';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { KeyValue } from '@/components/ui/KeyValue';

const TYPE_LABEL: Record<ListingType, string> = { job: 'Job', internship: 'Internship', mentorship: 'Mentorship' };

export function OpportunityDetailPage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: ['careerbridge', 'listing', id], queryFn: () => fetchListing(id), enabled: Boolean(id) });
  const [revealed, setRevealed] = useState(false);

  useDocumentMeta({ title: query.data?.title ?? 'Opportunity' });

  if (query.isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-72" />
      </Container>
    );
  }
  if (query.isError || !query.data) {
    return (
      <Container className="py-10">
        <ErrorState title="This listing isn't available" body="It may have expired, been filled, or is still awaiting review." />
      </Container>
    );
  }

  const listing = query.data;

  return (
    <Container width="narrow">
      <Section
        eyebrow={TYPE_LABEL[listing.type]}
        title={listing.title}
        description={`${listing.company} · ${listing.location} · ${listing.mode}`}
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {listing.status === 'filled' ? <Badge tone="neutral">Filled</Badge> : <Badge tone="green">Open</Badge>}
          {listing.rotaryAffiliation ? <Badge tone="pink">{listing.rotaryAffiliation}</Badge> : null}
        </div>

        <p className="whitespace-pre-line text-[14px] leading-relaxed text-fg-2">{listing.description}</p>

        <div className="mt-6">
          <KeyValue
            items={[
              { label: 'Stipend', value: listing.stipend ?? 'Not specified' },
              { label: 'Posted', value: new Date(listing.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
            ]}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {listing.applyUrl ? (
            <a
              href={listing.applyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 items-center rounded-[8px] bg-accent px-5 text-[13.5px] font-bold text-accent-fg shadow-button hover:bg-accent-hover"
            >
              Apply now
            </a>
          ) : null}
          {revealed ? (
            <a href={`mailto:${listing.contactEmail}`} className="inline-flex min-h-11 items-center rounded-[8px] border-2 border-accent px-5 text-[13.5px] font-bold text-accent">
              {listing.contactEmail}
            </a>
          ) : (
            <Button variant="secondary" onClick={() => setRevealed(true)}>
              Reveal contact email
            </Button>
          )}
        </div>

        <p className="mt-8 text-[12.5px]">
          <Link to="/opportunities" className="font-bold text-accent">
            ← Back to all opportunities
          </Link>
        </p>
      </Section>
    </Container>
  );
}
