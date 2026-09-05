import { useQuery } from '@tanstack/react-query';
import { titleCaseSlug } from '@/lib/format';
import { useDocumentMeta } from '@/lib/meta';
import { fetchPartners } from '@/lib/publicApi/partners';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function PartnersPage() {
  useDocumentMeta({ title: 'Partners', description: 'Organisations that support district projects.' });
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'partners'], queryFn: fetchPartners });

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} shape="rect" className="h-24" />
          ))}
        </div>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load partners" onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <Container>
      <Section eyebrow="District 3011" title="Partners" description="Organisations that support district projects.">
        {data.items.length === 0 ? (
          <EmptyState title="No partners listed yet" />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {data.items.map((partner) => (
              <div key={partner.id} className="flex flex-col items-center gap-2 rounded-[16px] border border-line-accent bg-surface p-5 text-center">
                {partner.logoUrl ? (
                  <img src={partner.logoUrl} alt={partner.name} className="h-12 w-auto max-w-full object-contain" />
                ) : (
                  <div data-state="pending-permission" className="flex h-12 w-full items-center justify-center rounded-[8px] bg-page text-[10.5px] font-bold text-fg-3">
                    Logo pending permission
                  </div>
                )}
                <p className="m-0 text-[12.5px] font-bold text-fg">{partner.name}</p>
                <Badge tone="neutral">{titleCaseSlug(partner.tier)}</Badge>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Container>
  );
}
