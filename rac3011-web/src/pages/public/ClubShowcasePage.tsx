import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchClub } from '@/lib/publicApi/clubs';
import { fetchProjects, categoryLabelOf } from '@/lib/publicApi/showcase';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function ClubShowcasePage() {
  const { clubSlug = '' } = useParams<{ clubSlug: string }>();
  const club = useQuery({ queryKey: ['public', 'clubs', clubSlug], queryFn: () => fetchClub(clubSlug) });
  const projects = useQuery({
    queryKey: ['public', 'projects', 'club', clubSlug],
    queryFn: () => fetchProjects({ clubSlug, pageSize: 50 }),
    enabled: !club.isError,
  });

  useDocumentMeta({ title: club.data ? `${club.data.name} showcase` : 'Club showcase' });

  if (club.isPending || projects.isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-52" />
      </Container>
    );
  }

  if (club.isError || !club.data) {
    return (
      <Container className="py-10">
        <ErrorState title="Club not found" onRetry={() => void club.refetch()} />
      </Container>
    );
  }

  const items = projects.data?.items ?? [];

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ label: 'Showcase', href: '/showcase' }, { label: club.data.name }]}
        linkComponent={Link}
      />
      <h1 className="m-0 mt-3 text-[27px] font-extrabold text-fg">{club.data.name}</h1>
      <p className="mt-1 text-[13px] text-fg-2">
        <Link to={`/leadership/clubs/${clubSlug}`} className="font-bold text-accent">
          View club profile
        </Link>
      </p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No published projects from this club yet" body="Once the club's showcase submissions are approved, they'll appear here." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((project) => (
            <Link key={project.id} to={project.slug ? `/showcase/${project.slug}` : '#'} className="block">
              <ImageSlot src={project.photos[0]} alt={project.title ?? 'Project photo'} prompt="Photo coming soon" />
              <p className="m-0 mt-2 text-[13.5px] font-extrabold text-fg">{project.title}</p>
              <p className="m-0 text-[11.5px] text-fg-3">{categoryLabelOf(project.category)}</p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
