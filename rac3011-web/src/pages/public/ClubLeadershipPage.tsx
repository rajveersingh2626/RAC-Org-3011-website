import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { useDocumentMeta } from '@/lib/meta';
import { fetchClub, whatsappLink } from '@/lib/publicApi/clubs';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Avatar } from '@/components/ui/Avatar';
import { Table, type Column } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BoardMember } from '@/lib/publicApi/clubs';

const COLUMNS: Column<BoardMember>[] = [
  { key: 'name', header: 'Name', cell: (r) => r.name },
  { key: 'position', header: 'Position', cell: (r) => r.position },
  { key: 'bloodGroup', header: 'Blood group', cell: (r) => r.bloodGroup ?? '—' },
  {
    key: 'contact',
    header: 'Contact',
    cell: (r) => (
      <span className="flex flex-wrap gap-2">
        {r.phone ? (
          <a href={whatsappLink(r.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-accent">
            <MessageCircle aria-hidden className="size-3.5" /> {r.phone}
          </a>
        ) : null}
        {r.email ? (
          <a href={`mailto:${r.email}`} className="font-bold text-accent">
            {r.email}
          </a>
        ) : null}
      </span>
    ),
  },
];

export function ClubLeadershipPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['public', 'clubs', slug, 'board'],
    queryFn: () => fetchClub(slug, ['board']),
  });

  useDocumentMeta({ title: data ? `${data.name} leadership` : 'Club leadership' });

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
        <ErrorState title="Club not found" onRetry={() => void refetch()} />
      </Container>
    );
  }

  const board = data.board ?? [];

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: 'Leadership', href: '/leadership' }, { label: data.name }]} linkComponent={Link} />
      <div className="mt-4 flex items-center gap-3">
        <Avatar name={data.name} src={data.logoUrl ?? undefined} size="lg" />
        <div>
          <h1 className="m-0 text-[22px] font-extrabold text-fg">{data.name}</h1>
          <p className="m-0 text-[12px] text-fg-3">{data.memberCount} members</p>
        </div>
      </div>

      <div className="mt-6">
        {board.length === 0 ? (
          <EmptyState title="This club's board hasn't been recorded yet" />
        ) : (
          <Table columns={COLUMNS} rows={board} rowKey={(r) => r.id} caption={`Board for RY ${board[0]?.ryYear}`} />
        )}
      </div>
    </Container>
  );
}
