import { useQuery } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { fetchAchievements } from '@/lib/publicApi/achievements';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function AchievementsPage() {
  useDocumentMeta({ title: 'Achievements', description: 'Milestones, awards and chartered clubs, district-wide.' });
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'achievements'], queryFn: fetchAchievements });

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} shape="rect" className="h-48" />
          ))}
        </div>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load achievements" onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <Container>
      <Section eyebrow="District 3011" title="Achievements" description="Milestones the district has reached, this Rotary year and beyond.">
        {data.items.length === 0 ? (
          <EmptyState title="No achievements published yet" />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((a) => (
              <div key={a.id}>
                <ImageSlot ratio="3:4" src={a.certificateUrl} alt={a.title} prompt="Certificate coming soon" />
                <p className="m-0 mt-2 text-[13px] font-extrabold text-fg">{a.title}</p>
                {a.description ? <p className="m-0 text-[11.5px] text-fg-2">{a.description}</p> : null}
                <p className="m-0 text-[11px] text-fg-3">{new Date(a.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Container>
  );
}
