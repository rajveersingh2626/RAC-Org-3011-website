import { Link, useNavigate } from 'react-router';
import { useSurfaceHref } from '@/app/host';
import { useDocumentMeta } from '@/lib/meta';
import { useHomeQuery } from '@/lib/publicApi/home';
import { useLiveVisits, useVisitOnce } from '@/lib/publicApi/live';
import { useIdlePrefetch } from '@/lib/prefetch';
import { HeroCarousel } from '@/components/public/HeroCarousel';
import { FlagshipCarousel } from '@/components/public/FlagshipCarousel';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

const CTA_CARDS = [
  { title: 'Start a new club', body: 'Charter a Rotaract club in your college or community.', to: '/get-involved/new-club' },
  { title: 'Sponsor a project', body: 'Fund a district project and see the impact, rupee for rupee.', to: '/get-involved/sponsor' },
  { title: 'Career Bridge', body: 'Post or find verified jobs, internships and mentorship.', to: '/careerbridge/opportunities', surface: 'careerbridge' as const },
  { title: 'Talk to us', body: 'Questions about the district or a project? Reach the secretariat.', to: '/contact' },
];

export function HomePage() {
  useDocumentMeta({ title: 'Rotaract District 3011', description: 'Young leaders in clubs across Delhi NCR — community, vocational and international service.' });
  const { data, isPending, isError, refetch } = useHomeQuery();
  const { data: liveVisits } = useLiveVisits();
  useVisitOnce();
  useIdlePrefetch(!isPending);
  const navigate = useNavigate();
  const careerBridgeHref = useSurfaceHref('careerbridge');

  if (isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-64" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} shape="rect" className="h-24" />
          ))}
        </div>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load the home page" body="Try again in a moment." onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <>
      <Container>
        <HeroCarousel
          slides={[data.hero]}
          onPrimaryClick={() => navigate('/map')}
          onSecondaryClick={() => navigate('/showcase')}
        />
      </Container>

      <Container>
        <Section eyebrow="This Rotary year" className="pt-0">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <Stat
                label="Visits this year"
                value={liveVisits ? liveVisits.count.toLocaleString('en-IN') : '—'}
                hint={liveVisits ? String(liveVisits.year) : undefined}
              />
            </Card>
            <Card>
              <Stat label="Zones" value={data.stats.zones} />
            </Card>
            <Card>
              <Stat label="Focus areas" value={data.stats.focusAreas} />
            </Card>
            <Card>
              <Stat label="Founded" value={data.stats.foundedYear} hint={`Age ${data.stats.ageRange}`} />
            </Card>
          </div>
        </Section>

        <Section eyebrow="Flagship initiatives" title="What the district is building">
          <FlagshipCarousel items={data.flagship} />
          {data.flagship.length === 0 ? (
            <EmptyState title="Flagship content is being prepared" body="Check back soon for this year's district-wide initiatives." />
          ) : null}
        </Section>

        <Section eyebrow="From the clubs" title="Showcase" action={<Link to="/showcase" className="text-[13px] font-bold text-accent">See all →</Link>}>
          {data.latestProjects.length === 0 ? (
            <EmptyState
              title="No published projects yet"
              body="Club submissions are reviewed before they appear here. Check back once the showcase queue starts publishing."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.latestProjects.map((project) => (
                <Link key={project.id} to={project.slug ? `/showcase/${project.slug}` : '/showcase'} className="block">
                  <ImageSlot src={project.photos[0]} alt={project.title ?? 'Project photo'} prompt="Photo coming soon" />
                  <p className="m-0 mt-2 text-[13.5px] font-extrabold text-fg">{project.title}</p>
                  <p className="m-0 text-[11.5px] text-fg-3">{project.leadClub?.name}</p>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section eyebrow="Get involved" className="pb-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CTA_CARDS.map((cta) =>
              'surface' in cta ? (
                <a key={cta.to} href={careerBridgeHref ?? '#'} className="block">
                  <Card title={cta.title} tone="action" className="h-full hover:shadow-raised">
                    {cta.body}
                  </Card>
                </a>
              ) : (
                <Link key={cta.to} to={cta.to} className="block">
                  <Card title={cta.title} tone="action" className="h-full hover:shadow-raised">
                    {cta.body}
                  </Card>
                </Link>
              ),
            )}
          </div>
        </Section>
      </Container>
    </>
  );
}
