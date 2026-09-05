import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Tabs } from '@/components/ui/Tabs';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchRideGallery, type PublicGalleryItem } from '@/lib/publicApi/ride';
import { videoEmbedUrl } from '@/lib/ride/video';

function GalleryTile({ item }: { item: PublicGalleryItem }) {
  if (item.kind === 'video') {
    const embed = videoEmbedUrl(item.url);
    return (
      <figure className="w-full">
        {embed ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-page">
            <iframe
              src={embed}
              title={item.caption ?? 'RIDE video'}
              className="absolute inset-0 size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-line bg-page px-4 text-center text-[11.5px] font-semibold text-accent"
          >
            Watch video
          </a>
        )}
        {item.caption ? <figcaption className="pt-1.5 text-[11.5px] text-fg-3">{item.caption}</figcaption> : null}
      </figure>
    );
  }
  return <ImageSlot src={item.url} alt={item.caption ?? 'RIDE gallery photo'} caption={item.caption} />;
}

export function RideGalleryPage() {
  useDocumentMeta({ title: 'RIDE — Gallery' });
  const query = useQuery({ queryKey: ['public', 'ride', 'gallery'], queryFn: () => fetchRideGallery() });
  const [year, setYear] = useState<string | null>(null);

  if (query.isPending) {
    return (
      <Container width="wide" className="py-10">
        <Skeleton shape="rect" className="h-64" />
      </Container>
    );
  }
  if (query.isError || !query.data) {
    return (
      <Container width="wide" className="py-10">
        <ErrorState title="Couldn't load the gallery" onRetry={() => void query.refetch()} />
      </Container>
    );
  }

  const { items, years } = query.data;
  if (years.length === 0) {
    return (
      <Container width="wide">
        <Section eyebrow="RIDE" title="Gallery">
          <EmptyState title="No photos yet" body="Photos and videos from hosted delegations will appear here." />
        </Section>
      </Container>
    );
  }

  const activeYear = year ?? String(years[0]);
  const visible = items.filter((i) => String(i.year) === activeYear);

  return (
    <Container width="wide">
      <Section eyebrow="RIDE" title="Gallery" description="Moments with visiting delegations, year by year.">
        <Tabs
          label="Gallery year"
          value={activeYear}
          onChange={setYear}
          tabs={years.map((y) => ({ id: String(y), label: String(y) }))}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <GalleryTile key={item.id} item={item} />
            ))}
          </div>
          {visible.length === 0 ? <EmptyState title="Nothing for this year yet" body="Check back after the next hosted visit." /> : null}
        </Tabs>
      </Section>
    </Container>
  );
}
