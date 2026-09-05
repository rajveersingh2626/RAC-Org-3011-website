import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchPastDrrs, groupByPrimaryTerm, groupTermsLabel } from '@/lib/publicApi/heritage';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function HeritagePage() {
  useDocumentMeta({ title: 'Heritage', description: 'Past District Rotaract Representatives, by term.' });
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'past-drrs'], queryFn: fetchPastDrrs });

  if (isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-48" />
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load the district's heritage" onRetry={() => void refetch()} />
      </Container>
    );
  }

  const groups = groupByPrimaryTerm(data.items);

  return (
    <Container>
      <Section eyebrow="District 3011" title="Heritage" description="Past District Rotaract Representatives who led the district, term by term.">
        {groups.length === 0 ? (
          <EmptyState title="Heritage records are being compiled" body="Check back soon for the district's past leadership." />
        ) : (
          <div className="flex flex-col gap-10">
            {groups.map(([term, drrs]) => (
              <div key={term}>
                <h2 className="m-0 mb-4 text-[13px] font-extrabold uppercase tracking-[1px] text-accent">{term}</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {drrs.map((drr) => (
                    <Link key={drr.id} to={`/heritage/${drr.slug}`} className="block text-center">
                      <ImageSlot
                        ratio="1:1"
                        src={drr.photoUrl}
                        alt={drr.name}
                        prompt="No photo on file"
                        className={drr.isLowResPhoto ? 'max-w-[160px] mx-auto' : undefined}
                      />
                      <p className="m-0 mt-2 text-[13.5px] font-extrabold text-fg">{drr.name}</p>
                      <p className="m-0 text-[11.5px] text-fg-3">{groupTermsLabel(drr.terms)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Container>
  );
}
