import { useQuery } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { fetchPublications } from '@/lib/publicApi/publications';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

const TYPE_LABEL: Record<string, string> = { directory: 'Directory', newsletter: 'Newsletter' };

export function PublicationsPage() {
  useDocumentMeta({ title: 'Publications', description: 'District directories and newsletters.' });
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'publications'], queryFn: fetchPublications });

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} shape="rect" className="h-48" />
          ))}
        </div>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load publications" onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <Container>
      <Section eyebrow="For members" title="Publications" description="District directories and newsletters, issue by issue.">
        {data.items.length === 0 ? (
          <EmptyState title="No publications yet" body="Directories and newsletters will appear here once issued." />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((pub) => (
              <a key={pub.id} href={pub.url} target="_blank" rel="noreferrer" className="block">
                <ImageSlot ratio="3:4" src={pub.coverUrl} alt={pub.title} prompt="Cover coming soon" />
                <p className="m-0 mt-2 text-[13px] font-extrabold text-fg">{pub.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone="neutral">{TYPE_LABEL[pub.type] ?? pub.type}</Badge>
                  <span className="text-[11px] text-fg-3">{pub.month}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </Section>
    </Container>
  );
}
