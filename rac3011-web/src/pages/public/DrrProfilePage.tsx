import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchPastDrr, groupTermsLabel } from '@/lib/publicApi/heritage';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { LowResPortrait } from '@/components/public/LowResPortrait';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function DrrProfilePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'past-drrs', slug], queryFn: () => fetchPastDrr(slug) });

  useDocumentMeta({ title: data ? `${data.name} · Heritage` : 'Heritage profile' });

  if (isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-52" />
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="This profile couldn't be found" onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <Container className="py-8" width="narrow">
      <Breadcrumbs items={[{ label: 'Heritage', href: '/heritage' }, { label: data.name }]} linkComponent={Link} />
      <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row">
        {data.isLowResPhoto ? (
          <LowResPortrait src={data.photoUrl} alt={data.name} />
        ) : (
          <ImageSlot ratio="1:1" src={data.photoUrl} alt={data.name} prompt="No photo on file" className="max-w-[220px]" />
        )}
        <div>
          <h1 className="m-0 text-[24px] font-extrabold text-fg">{data.name}</h1>
          <p className="m-0 mt-1 text-[13px] font-bold text-accent">{groupTermsLabel(data.terms)}</p>
          {data.bio ? <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">{data.bio}</p> : null}
        </div>
      </div>
    </Container>
  );
}
