import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchResources, categoryLabel } from '@/lib/publicApi/resources';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function ResourcesPage() {
  useDocumentMeta({ title: 'Resources', description: 'Guides, templates and toolkits for club officers.' });
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'resources'], queryFn: fetchResources });

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of data?.items ?? []) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    return Array.from(counts.entries());
  }, [data]);

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} shape="rect" className="h-32" />
          ))}
        </div>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load resources" onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <Container>
      <Section eyebrow="For members" title="Resources" description="Guides, templates and toolkits for club officers, organised by category.">
        {categories.length === 0 ? (
          <EmptyState title="The resource library is being built" body="Categories will appear here as the district publishes guides and templates." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(([category, count]) => (
              <Link key={category} to={`/resources/${encodeURIComponent(category)}`} className="block">
                <Card title={categoryLabel(category)} footer={<span className="text-[11.5px] text-fg-3">{count} resource{count === 1 ? '' : 's'}</span>} />
              </Link>
            ))}
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/resources/guest-kit" className="inline-flex min-h-11 items-center rounded-[8px] border-2 border-accent px-5 text-[13.5px] font-bold text-accent hover:bg-accent-soft">
            Guest kit
          </Link>
          <Link to="/resources/sister-club" className="inline-flex min-h-11 items-center rounded-[8px] border-2 border-accent px-5 text-[13.5px] font-bold text-accent hover:bg-accent-soft">
            Sister club request
          </Link>
        </div>
      </Section>
    </Container>
  );
}
