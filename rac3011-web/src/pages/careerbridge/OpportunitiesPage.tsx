import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchListings } from '@/lib/publicApi/careerbridge';
import type { ListingType } from '@/lib/careerbridge/types';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

const TYPE_LABEL: Record<ListingType, string> = { job: 'Jobs', internship: 'Internships', mentorship: 'Mentorship' };

export function OpportunitiesPage() {
  useDocumentMeta({ title: 'Opportunities', description: 'Jobs, internships and mentorship posted for Rotaractors across the district.' });
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const type = (params.get('type') as ListingType | null) ?? undefined;

  const query = useQuery({ queryKey: ['careerbridge', 'listings', type ?? null], queryFn: () => fetchListings({ type }) });

  const setType = (next: ListingType | undefined) => {
    const p = new URLSearchParams(params);
    if (next) p.set('type', next);
    else p.delete('type');
    setParams(p);
  };

  return (
    <Container>
      <Section
        eyebrow="Career Bridge"
        title="Opportunities"
        description="Jobs, internships and mentorship shared by clubs, companies and Rotaractors across the district."
        action={<Button onClick={() => navigate('/post')}>Post an opening</Button>}
      >
        <div className="mb-5 flex flex-wrap gap-2">
          <Chip selected={!type} onClick={() => setType(undefined)}>
            All types
          </Chip>
          {(Object.keys(TYPE_LABEL) as ListingType[]).map((t) => (
            <Chip key={t} selected={type === t} onClick={() => setType(t)}>
              {TYPE_LABEL[t]}
            </Chip>
          ))}
        </div>

        {query.isPending ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} shape="rect" className="h-40" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState title="Couldn't load opportunities" onRetry={() => void query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState title="Nothing posted yet" body="Verified opportunities from clubs, companies and Rotaractors will show up here." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.items.map((listing) => (
              <Link key={listing.id} to={`/opportunities/${listing.id}`} className="block h-full">
                <Card
                  eyebrow={TYPE_LABEL[listing.type]}
                  title={listing.title}
                  footer={listing.status === 'filled' ? <Badge tone="neutral">Filled</Badge> : <Badge tone="green">Open</Badge>}
                >
                  <p className="m-0 font-bold text-fg">{listing.company}</p>
                  <p className="m-0 text-fg-3">{listing.location} · {listing.mode}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </Container>
  );
}
