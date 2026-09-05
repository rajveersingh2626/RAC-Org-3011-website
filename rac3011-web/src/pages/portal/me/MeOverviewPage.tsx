import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { API_ORIGIN } from '@/lib/api';
import { fetchMyCard } from '@/lib/members/api';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { KeyValue } from '@/components/ui/KeyValue';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';

function formatMemberSince(iso: string | null): string {
  if (!iso) return 'Not recorded yet';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function MeOverviewPage() {
  useDocumentMeta({ title: 'Me' });
  const { me } = useAuth();
  const cardQuery = useQuery({ queryKey: ['me', 'card'], queryFn: fetchMyCard });

  return (
    <Container width="wide">
      <Section
        eyebrow="Visible to you and your club officers, nobody else"
        title={me?.user.name ?? 'Me'}
        description="Your membership card, and quick links to your profile and settings."
      >
        {cardQuery.isPending ? (
          <Skeleton shape="rect" className="h-56" />
        ) : cardQuery.isError ? (
          <ErrorState title="Couldn't load your membership card" onRetry={() => void cardQuery.refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={cardQuery.data.fullName} src={me?.profile?.photoUrl ?? undefined} size="lg" />
                  <div>
                    <p className="m-0 text-[10.5px] font-bold tracking-[1px] text-accent-deep">MEMBERSHIP CARD</p>
                    <p className="m-0 text-[16px] font-extrabold text-fg">{cardQuery.data.clubName}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <KeyValue
                  items={[
                    { label: 'Member since', value: formatMemberSince(cardQuery.data.memberSince) },
                    { label: 'ID', value: cardQuery.data.cardId },
                  ]}
                />
              </div>
              <p className="m-0 mt-4 text-[11.5px] text-fg-3">
                Show this at a district event and somebody scans it &ndash; that&apos;s what the QR code on the
                right is for.
              </p>
            </Card>
            <Card>
              <p className="m-0 mb-3 text-[10.5px] font-bold tracking-[1px] text-fg-3">SCAN AT CHECK-IN</p>
              <img
                src={`${API_ORIGIN}/me/qr.svg`}
                alt="Your check-in QR code"
                width={200}
                height={200}
                className="mx-auto block"
              />
            </Card>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link to="/portal/me/profile">
            <Button variant="secondary" block>
              Edit profile
            </Button>
          </Link>
          <Link to="/portal/my-club">
            <Button variant="secondary" block>
              My club
            </Button>
          </Link>
          <Link to="/portal/me/settings">
            <Button variant="secondary" block>
              Settings
            </Button>
          </Link>
        </div>
      </Section>
    </Container>
  );
}
