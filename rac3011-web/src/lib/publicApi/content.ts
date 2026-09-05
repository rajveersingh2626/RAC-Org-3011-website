import { z } from 'zod';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

const contentBlocksSchema = z.record(z.string(), z.object({ type: z.string(), value: z.unknown() }));
export type ContentBlocks = z.infer<typeof contentBlocksSchema>;

export function fetchContent(pageKey: string): Promise<ContentBlocks> {
  return apiFetch(`/public/content/${encodeURIComponent(pageKey)}`, { schema: contentBlocksSchema });
}

export function useContentQuery(pageKey: string): UseQueryResult<ContentBlocks> {
  return useQuery({ queryKey: ['public', 'content', pageKey], queryFn: () => fetchContent(pageKey) });
}

export function richTextOf(blocks: ContentBlocks | undefined, sectionKey: string): string | null {
  const block = blocks?.[sectionKey];
  if (!block || block.type !== 'richtext' || typeof block.value !== 'string') return null;
  return block.value;
}

export function textOf(blocks: ContentBlocks | undefined, sectionKey: string): string | null {
  const block = blocks?.[sectionKey];
  if (!block || typeof block.value !== 'string') return null;
  return block.value;
}
