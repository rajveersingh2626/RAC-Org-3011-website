import { useQuery } from '@tanstack/react-query';
import { CircleOff } from 'lucide-react';
import { useSurfaceHref } from '@/app/host';
import { useDocumentMeta } from '@/lib/meta';
import { fetchInitiatives, type InitiativeCard } from '@/lib/publicApi/initiatives';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RadialGauge } from '@/components/ui/RadialGauge';
import { KeyValue } from '@/components/ui/KeyValue';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

function InitiativeTile({ card }: { card: InitiativeCard }) {
  const href = useSurfaceHref(card.key) ?? '#';

  if (card.status === 'unassigned') {
    return (
      <Card as="a" href={href} tone="dashed" eyebrow={card.label}>
        <p className="m-0">{card.description}</p>
        <Badge tone="neutral" className="mt-3">
          Open for bidding
        </Badge>
      </Card>
    );
  }

  if (card.status === 'unreachable') {
    return (
      <Card as="a" href={href} eyebrow={card.label}>
        <p className="m-0">{card.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-fg-3">
          <CircleOff aria-hidden className="size-3.5" /> Live data temporarily unavailable
        </p>
      </Card>
    );
  }

  const { summary } = card;
  return (
    <Card as="a" href={href} eyebrow={card.label} title={summary.headline}>
      <div className="flex items-center gap-4">
        {summary.target ? (
          <RadialGauge value={summary.value} max={summary.target} sublabel={summary.unit} />
        ) : (
          <p className="m-0 text-[27px] font-extrabold text-fg">
            {summary.value.toLocaleString('en-IN')} <span className="text-[13px] font-bold text-fg-3">{summary.unit}</span>
          </p>
        )}
        <div className="min-w-0 flex-1">
          {summary.secondary.length > 0 ? (
            <KeyValue items={summary.secondary.map((s) => ({ label: s.label, value: s.value }))} />
          ) : null}
        </div>
      </div>
      <p className="mt-3 m-0 text-[11px] text-fg-3">Updated {new Date(summary.updatedAt).toLocaleDateString('en-IN')}</p>
    </Card>
  );
}

export function InitiativesPage() {
  useDocumentMeta({ title: 'Initiatives', description: 'Flagship district-wide projects, and where they stand right now.' });
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'initiatives'], queryFn: fetchInitiatives });

  if (isPending) {
    return (
      <Container className="py-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} shape="rect" className="h-40" />
          ))}
        </div>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load district initiatives" onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <Container>
      <Section eyebrow="District 3011" title="Initiatives" description="Flagship district-wide projects, and where they stand right now.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {data.items.map((card) => (
            <InitiativeTile key={card.key} card={card} />
          ))}
        </div>
      </Section>
    </Container>
  );
}
