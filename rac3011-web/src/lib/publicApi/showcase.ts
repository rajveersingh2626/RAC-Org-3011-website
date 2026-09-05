import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { titleCaseSlug } from '@/lib/format';

export const categoryLabelOf = titleCaseSlug;

const clubRefSchema = z.object({ id: z.string(), name: z.string(), shortName: z.string().nullable(), slug: z.string().nullable() });

export const projectSummarySchema = z.object({
  id: z.string(),
  slug: z.string().nullable(),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  category: z.string(),
  date: z.string(),
  photos: z.array(z.string()),
  leadClub: clubRefSchema.nullable(),
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const projectDetailSchema = projectSummarySchema.extend({
  body: z.string().nullable(),
  beneficiaries: z.number().nullable(),
  clubs: z.array(z.object({ role: z.enum(['lead', 'collaborator']), club: clubRefSchema })),
  publishedAt: z.string().nullable(),
});
export type ProjectDetail = z.infer<typeof projectDetailSchema>;

const projectListSchema = z.object({
  items: z.array(projectSummarySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type ProjectListResult = z.infer<typeof projectListSchema>;

export interface ProjectListParams {
  category?: string;
  clubSlug?: string;
  page?: number;
  pageSize?: number;
}

export function fetchProjects(params: ProjectListParams = {}): Promise<ProjectListResult> {
  const search = new URLSearchParams();
  if (params.category) search.set('filter[category]', params.category);
  if (params.clubSlug) search.set('filter[clubSlug]', params.clubSlug);
  search.set('page', String(params.page ?? 1));
  search.set('pageSize', String(params.pageSize ?? 12));
  return apiFetch(`/public/projects?${search.toString()}`, { schema: projectListSchema });
}

export function fetchProject(slug: string): Promise<ProjectDetail> {
  return apiFetch(`/public/projects/${encodeURIComponent(slug)}`, { schema: projectDetailSchema });
}
