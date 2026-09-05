import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchProject, categoryLabelOf } from '@/lib/publicApi/showcase';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { KeyValue } from '@/components/ui/KeyValue';

export function ShowcaseDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'projects', slug], queryFn: () => fetchProject(slug) });

  useDocumentMeta({
    title: data?.title ?? 'Showcase project',
    description: data?.summary ?? undefined,
    ogImage: data?.photos[0] ?? undefined,
  });

  if (isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-72" />
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="This project couldn't be found" body="It may have been unpublished." onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <Container className="py-8" width="narrow">
      <Breadcrumbs items={[{ label: 'Showcase', href: '/showcase' }, { label: data.title ?? 'Project' }]} linkComponent={Link} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="pink">{categoryLabelOf(data.category)}</Badge>
        <span className="text-[12px] text-fg-3">{data.date}</span>
      </div>
      <h1 className="m-0 mt-2 text-[27px] font-extrabold leading-tight text-fg">{data.title}</h1>
      {data.summary ? <p className="mt-2 text-[15px] text-fg-2">{data.summary}</p> : null}

      {data.photos.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.photos.map((photo, i) => (
            <ImageSlot key={photo + i} src={photo} alt={`${data.title ?? 'Project'} photo ${i + 1}`} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <ImageSlot src={null} alt="Project photo" prompt="No photos published yet" />
        </div>
      )}

      {data.body ? <div className="mt-6 whitespace-pre-line text-[13.5px] leading-relaxed text-fg-2">{data.body}</div> : null}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <KeyValue
          items={[
            { label: 'Beneficiaries reached', value: data.beneficiaries ?? 'Not reported' },
            { label: 'Published', value: data.publishedAt ? new Date(data.publishedAt).toLocaleDateString('en-IN') : 'Not yet' },
          ]}
        />
        <div>
          <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[1px] text-fg-3">Clubs involved</p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {data.clubs.map(({ role, club }) => (
              <li key={club.id} className="text-[13px] text-fg">
                {club.slug ? (
                  <Link to={`/showcase/clubs/${club.slug}`} className="font-bold text-accent">
                    {club.name}
                  </Link>
                ) : (
                  club.name
                )}{' '}
                <span className="text-fg-3">({role})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
