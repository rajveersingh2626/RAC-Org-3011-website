import { z } from 'zod';

export const CONTENT_TYPES = ['text', 'richtext', 'image', 'link', 'list'] as const;
export type ContentBlockType = (typeof CONTENT_TYPES)[number];

export const contentBlockSchema = z.object({
  pageKey: z.string(),
  sectionKey: z.string(),
  type: z.enum(CONTENT_TYPES),
  draftValue: z.unknown(),
  publishedValue: z.unknown(),
  publishedAt: z.string().nullable(),
  updatedById: z.string().nullable(),
  linkStatus: z.enum(['ok', 'broken', 'private']).optional(),
});
export type ContentBlock = z.infer<typeof contentBlockSchema>;

export function assetUrlOf(type: ContentBlockType, value: unknown): string {
  if (type !== 'image' && type !== 'link') return '';
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string') {
    return (value as { url: string }).url;
  }
  return '';
}
