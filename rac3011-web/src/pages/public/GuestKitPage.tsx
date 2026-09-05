import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchDistrictTeam } from '@/lib/publicApi/leadership';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CopyButton } from '@/components/public/CopyButton';

export function GuestKitPage() {
  useDocumentMeta({ title: 'Guest kit', description: 'District leadership bios and photos, ready to paste into an invitation.' });
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'district-team'], queryFn: fetchDistrictTeam });

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
        <ErrorState title="Couldn't load the guest kit" onRetry={() => void refetch()} />
      </Container>
    );
  }

  const guests = data.items.filter((m) => m.kind === 'core');

  return (
    <Container className="py-8" width="narrow">
      <Breadcrumbs items={[{ label: 'Resources', href: '/resources' }, { label: 'Guest kit' }]} linkComponent={Link} />
      <h1 className="m-0 mt-3 text-[24px] font-extrabold text-fg">Guest kit</h1>
      <p className="mt-2 text-[13.5px] text-fg-2">Copy a bio and contact for your club's invitation, chief guest note or event program.</p>

      {guests.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="District leadership hasn't been published yet" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {guests.map((guest) => {
            const bio = guest.bio ?? `${guest.name}, ${guest.designation}, Rotaract District 3011.`;
            const contact = [guest.phone, guest.email].filter(Boolean).join(' · ');
            return (
              <div key={guest.id} className="flex flex-col gap-3 rounded-[16px] border border-line-accent bg-surface p-5 sm:flex-row">
                <Avatar name={guest.name} src={guest.photoUrl ?? undefined} size="xl" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[15px] font-extrabold text-fg">{guest.name}</p>
                  <p className="m-0 text-[12px] text-fg-3">{guest.designation}</p>
                  <p className="mt-2 text-[13px] text-fg-2">{bio}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <CopyButton value={bio} label="Copy bio" />
                    {contact ? <CopyButton value={contact} label="Copy contact" /> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
