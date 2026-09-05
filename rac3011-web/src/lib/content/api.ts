import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { contentBlockSchema, type ContentBlock, type ContentBlockType } from './types';

const listSchema = z.object({ items: z.array(contentBlockSchema) });

export async function fetchContentBlocks(pageKey?: string): Promise<ContentBlock[]> {
  const qs = pageKey ? `?${new URLSearchParams({ 'filter[pageKey]': pageKey }).toString()}` : '';
  const res = await apiFetch(`/content-blocks${qs}`, { schema: listSchema });
  return res.items;
}

export interface PatchContentBlockInput {
  type?: ContentBlockType;
  draftValue?: unknown;
  publish?: boolean;
}

export async function patchContentBlock(
  pageKey: string,
  sectionKey: string,
  input: PatchContentBlockInput,
): Promise<ContentBlock> {
  return apiFetch(`/content-blocks/${encodeURIComponent(pageKey)}/${encodeURIComponent(sectionKey)}`, {
    method: 'PATCH',
    body: input,
    schema: contentBlockSchema,
  });
}
