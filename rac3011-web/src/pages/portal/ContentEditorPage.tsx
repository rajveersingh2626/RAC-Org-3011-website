import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchContentBlocks } from '@/lib/content/api';
import type { ContentBlock } from '@/lib/content/types';
import { fetchAssetLinks, recheckAssetLink } from '@/lib/linkHealth/api';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InlineStatus } from '@/components/ui/InlineStatus';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { ContentBlockEditor } from './ContentBlockEditor';

function pageTitle(pageKey: string): string {
  return pageKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function BrokenLinksSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ['asset-links'], queryFn: () => fetchAssetLinks() });
  const recheck = useMutation({
    mutationFn: recheckAssetLink,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['asset-links'] }),
    onError: (err) => toast({ title: 'Recheck failed', body: (err as Error).message, tone: 'error' }),
  });

  if (query.isPending) return <Skeleton shape="rect" className="h-24" />;
  if (query.isError) return <ErrorState title="Couldn't load link health" onRetry={() => void query.refetch()} />;

  const unhealthy = (query.data ?? []).filter((l) => l.status === 'broken' || l.status === 'private');
  if (unhealthy.length === 0) {
    return <EmptyState title="No broken links" body="Every tracked asset link resolved on its last check." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {unhealthy.map((link) => (
        <div
          key={link.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line-accent bg-surface px-4 py-3"
        >
          <div className="min-w-0">
            <p className="m-0 truncate text-[12.5px] font-bold text-fg">{link.url}</p>
            <p className="m-0 text-[11px] text-fg-3">
              {link.resourceType}:{link.resourceId} · {link.kind}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <InlineStatus state={link.status === 'unchecked' ? 'checking' : link.status} />
            <Button size="sm" variant="secondary" loading={recheck.isPending} onClick={() => recheck.mutate(link.id)}>
              Recheck
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ContentEditorPage() {
  useDocumentMeta({ title: 'Content' });
  const [openPage, setOpenPage] = useState<string | null>(null);
  const blocksQuery = useQuery({ queryKey: ['content-blocks'], queryFn: () => fetchContentBlocks() });

  const byPage = useMemo(() => {
    const map = new Map<string, ContentBlock[]>();
    for (const block of blocksQuery.data ?? []) {
      const list = map.get(block.pageKey) ?? [];
      list.push(block);
      map.set(block.pageKey, list);
    }
    return map;
  }, [blocksQuery.data]);

  if (blocksQuery.isPending) {
    return (
      <Container width="wide">
        <Skeleton shape="rect" className="h-96" />
      </Container>
    );
  }
  if (blocksQuery.isError) {
    return (
      <Container width="wide">
        <ErrorState title="Couldn't load content" onRetry={() => void blocksQuery.refetch()} />
      </Container>
    );
  }

  const pageKeys = [...byPage.keys()].sort();
  const openBlocks = openPage ? (byPage.get(openPage) ?? []) : [];

  return (
    <Container width="wide">
      <Section
        title="Content"
        description="Publish rights only. You can change what the public sees and nothing else — no club data, no reports, no accounts."
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {pageKeys.map((pageKey) => {
            const blocks = byPage.get(pageKey) ?? [];
            const publishedCount = blocks.filter((b) => b.publishedAt !== null).length;
            return (
              <Card
                key={pageKey}
                tone={openPage === pageKey ? 'action' : 'plain'}
                eyebrow={`${blocks.length} section${blocks.length === 1 ? '' : 's'}`}
                title={pageTitle(pageKey)}
                footer={
                  <Button variant="link" size="sm" onClick={() => setOpenPage(pageKey)}>
                    Edit →
                  </Button>
                }
              >
                {publishedCount} of {blocks.length} published
              </Card>
            );
          })}
        </div>

        {openPage ? (
          <Card className="mt-6" title={pageTitle(openPage)} eyebrow="Sections">
            <div className="mt-2 flex flex-col">
              {openBlocks.map((block) => (
                <ContentBlockEditor key={`${block.pageKey}:${block.sectionKey}`} block={block} />
              ))}
            </div>
          </Card>
        ) : null}
      </Section>

      <Section
        className="mt-8"
        eyebrow="Every asset is a link, not an upload"
        title="Broken links"
        description="A background check marks broken links so a homepage photo never quietly dies unnoticed."
      >
        <BrokenLinksSection />
      </Section>
    </Container>
  );
}
