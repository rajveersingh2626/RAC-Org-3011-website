import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Search } from 'lucide-react';
import { useDocumentMeta } from '@/lib/meta';
import { fetchDistrictTeam } from '@/lib/publicApi/leadership';
import { fetchClubs } from '@/lib/publicApi/clubs';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function LeadershipPage() {
  useDocumentMeta({ title: 'Leadership', description: 'The district team for the current Rotary year, and every club’s leadership.' });
  const team = useQuery({ queryKey: ['public', 'district-team'], queryFn: fetchDistrictTeam });
  const clubs = useQuery({ queryKey: ['public', 'clubs'], queryFn: () => fetchClubs() });
  const [query, setQuery] = useState('');

  const filteredClubs = useMemo(() => {
    const items = clubs.data?.items ?? [];
    const q = query.trim().toLowerCase();
    return q ? items.filter((c) => c.name.toLowerCase().includes(q)) : items;
  }, [clubs.data, query]);

  if (team.isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-48" />
      </Container>
    );
  }

  if (team.isError || !team.data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load the district team" onRetry={() => void team.refetch()} />
      </Container>
    );
  }

  const core = team.data.items.filter((m) => m.kind === 'core');
  const dsc = team.data.items.filter((m) => m.kind === 'dsc');

  return (
    <Container>
      <Section eyebrow="District 3011" title="Leadership" description="The district team for the current Rotary year.">
        {core.length === 0 ? (
          <EmptyState title="The district team hasn't been published yet" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {core.map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-2 rounded-[16px] border border-line-accent bg-surface p-5 text-center">
                <Avatar name={member.name} src={member.photoUrl ?? undefined} size="xl" />
                <p className="m-0 text-[14.5px] font-extrabold text-fg">{member.name}</p>
                <p className="m-0 text-[12px] text-fg-2">{member.designation}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {dsc.length > 0 ? (
        <Section eyebrow="District Support Cabinet" title="Zonal team">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dsc.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-[12px] border border-line-accent bg-surface p-4">
                <Avatar name={member.name} src={member.photoUrl ?? undefined} />
                <div className="min-w-0">
                  <p className="m-0 truncate text-[13px] font-extrabold text-fg">{member.name}</p>
                  <p className="m-0 truncate text-[11.5px] text-fg-3">{member.designation}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section eyebrow="Clubs" title="Club leadership" description={`${clubs.data?.items.length ?? 0} clubs in the district.`}>
        <div className="mb-4 max-w-[360px]">
          <Input
            aria-label="Search clubs by name"
            placeholder="Search clubs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {clubs.isPending ? (
          <Skeleton shape="rect" className="h-40" />
        ) : filteredClubs.length === 0 ? (
          <EmptyState title="No clubs match your search" icon={<Search aria-hidden className="size-6" />} />
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <li key={club.id}>
                <Link
                  to={club.slug ? `/leadership/clubs/${club.slug}` : '/leadership'}
                  className="flex min-h-11 items-center gap-2 rounded-[8px] border border-line-accent px-3 text-[13px] font-bold text-fg hover:bg-accent-soft"
                >
                  <Avatar name={club.name} src={club.logoUrl ?? undefined} size="sm" />
                  <span className="truncate">{club.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Container>
  );
}
