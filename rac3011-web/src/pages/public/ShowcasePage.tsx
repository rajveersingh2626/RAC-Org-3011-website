import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchProjects, categoryLabelOf } from '@/lib/publicApi/showcase';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 12;

export function ShowcasePage() {
  useDocumentMeta({ title: 'Showcase', description: 'Community, vocational and international service projects from clubs across the district.' });
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? undefined;
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const all = useQuery({ queryKey: ['public', 'projects', 'categories'], queryFn: () => fetchProjects({ pageSize: 100 }) });
  const list = useQuery({
    queryKey: ['public', 'projects', category ?? null, page],
    queryFn: () => fetchProjects({ category, page, pageSize: PAGE_SIZE }),
  });

  const categories = useMemo(
    () => Array.from(new Set((all.data?.items ?? []).map((p) => p.category))).sort(),
    [all.data],
  );

  const setCategory = (next: string | undefined) => {
    const p = new URLSearchParams(params);
    if (next) p.set('category', next);
    else p.delete('category');
    p.delete('page');
    setParams(p);
  };

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set('page', String(next));
    setParams(p);
  };

  if (list.isPending) {
    return (
      <Container className="py-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} shape="rect" className="h-52" />
          ))}
        </div>
      </Container>
    );
  }

  if (list.isError || !list.data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load the showcase" onRetry={() => void list.refetch()} />
      </Container>
    );
  }

  const totalPages = Math.max(1, Math.ceil(list.data.total / list.data.pageSize));

  return (
    <Container>
      <Section eyebrow="From the clubs" title="Showcase" description="Projects published after review, straight from club submissions.">
        {categories.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            <Chip selected={!category} onClick={() => setCategory(undefined)}>
              All categories
            </Chip>
            {categories.map((c) => (
              <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
                {categoryLabelOf(c)}
              </Chip>
            ))}
          </div>
        ) : null}

        {list.data.items.length === 0 ? (
          <EmptyState
            title="No published projects yet"
            body="Submissions from clubs are reviewed by the district before they're published here. This page will fill in as the showcase queue starts publishing."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {list.data.items.map((project) => (
                <Link key={project.id} to={project.slug ? `/showcase/${project.slug}` : '#'} className="block h-full">
                  <ImageSlot src={project.photos[0]} alt={project.title ?? 'Project photo'} prompt="Photo coming soon" />
                  <p className="m-0 mt-2 line-clamp-2 text-[13.5px] font-extrabold text-fg">{project.title}</p>
                  <p className="m-0 text-[11.5px] text-fg-3">{project.leadClub?.name ?? categoryLabelOf(project.category)}</p>
                </Link>
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-8">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} label="Showcase pages" />
              </div>
            ) : null}
          </>
        )}
      </Section>
    </Container>
  );
}
