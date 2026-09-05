import { apiFetch } from '@/lib/api';
import { paginatedSchema, projectSchema, type Project, type ProjectStatus } from './types';

const projectsPage = paginatedSchema(projectSchema);

export interface ProjectListParams {
  status?: ProjectStatus;
  clubId?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export async function fetchMyProjects(params: ProjectListParams = {}) {
  const qs = query({
    'filter[status]': params.status,
    'filter[clubId]': params.clubId,
    'filter[category]': params.category,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/projects${qs}`, { schema: projectsPage });
}

export async function fetchProject(id: string): Promise<Project> {
  return apiFetch(`/projects/${encodeURIComponent(id)}`, { schema: projectSchema });
}

export interface CreateProjectInput {
  title: string;
  category: string;
  date: string;
  summary: string;
  body?: string | null;
  beneficiaries?: number | null;
  photos?: string[];
  collaboratingClubIds?: string[];
  consentConfirmed?: boolean;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return apiFetch('/projects', { method: 'POST', body: input, schema: projectSchema });
}

export interface UpdateProjectInput {
  title?: string;
  category?: string;
  date?: string;
  summary?: string;
  body?: string | null;
  beneficiaries?: number | null;
  photos?: string[];
  collaboratingClubIds?: string[];
  consentConfirmed?: boolean;
  publishedTitle?: string | null;
  publishedSummary?: string | null;
  publishedBody?: string | null;
  editorNotes?: string | null;
  rejectionReason?: string | null;
  status?: 'submitted' | 'published' | 'rejected';
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  return apiFetch(`/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: projectSchema });
}

export async function deleteProject(id: string): Promise<void> {
  await apiFetch(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
