import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Lock } from 'lucide-react';
import { useDocumentMeta } from '@/lib/meta';
import { fetchResources, categoryLabel } from '@/lib/publicApi/resources';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

interface ResourceCategoryPageProps {
  category?: string;
}

export function ResourceCategoryPage({ category: fixedCategory }: ResourceCategoryPageProps) {
  const { category: paramCategory } = useParams<{ category: string }>();
  const category = fixedCategory ?? paramCategory ?? '';
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'resources'], queryFn: fetchResources });

  useDocumentMeta({ title: `${categoryLabel(category)} resources` });

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
        <ErrorState title="Couldn't load this category" onRetry={() => void refetch()} />
      </Container>
    );
  }

  const items = data.items.filter((r) => r.category === category);

  return (
    <Container className="py-8" width="narrow">
      <Breadcrumbs items={[{ label: 'Resources', href: '/resources' }, { label: categoryLabel(category) }]} linkComponent={Link} />
      <h1 className="m-0 mt-3 text-[24px] font-extrabold text-fg">{categoryLabel(category)}</h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing published in this category yet" />
        </div>
      ) : (
        <ul className="m-0 mt-6 flex list-none flex-col gap-2 p-0">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-line-accent bg-surface p-4">
              <div className="min-w-0">
                <p className="m-0 truncate text-[13.5px] font-extrabold text-fg">{r.title}</p>
                {r.description ? <p className="m-0 truncate text-[12px] text-fg-2">{r.description}</p> : null}
              </div>
              {r.comingSoonMonth ? (
                <Badge tone="amber">Coming {r.comingSoonMonth}</Badge>
              ) : r.isLocked || !r.url ? (
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone="neutral">
                    <Lock aria-hidden className="size-3" /> Locked
                  </Badge>
                  <Link to="/portal/login" className="text-[12px] font-bold text-accent">
                    Sign in
                  </Link>
                </span>
              ) : (
                <a href={r.url} target="_blank" rel="noreferrer" className="shrink-0 text-[12.5px] font-bold text-accent">
                  Open →
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
