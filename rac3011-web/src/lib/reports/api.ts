import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import {
  assistResultSchema,
  paginatedSchema,
  reportRequestResponseSchema,
  reportRequestSchema,
  reportSchema,
  reportSchemaSummarySchema,
  reportSchemaWithFieldsSchema,
  type AssistResult,
  type Report,
  type ReportRequest,
  type ReportRequestAudience,
  type ReportRequestResponse,
  type ReportSchemaSummary,
  type ReportSchemaWithFields,
  type ReportStatus,
} from './types';

const reportsPage = paginatedSchema(reportSchema);

export interface ReportListParams {
  clubId?: string;
  ryYear?: number;
  month?: string;
  status?: ReportStatus;
  include?: Array<'queries' | 'club'>;
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

export async function fetchReports(params: ReportListParams = {}) {
  const qs = query({
    'filter[clubId]': params.clubId,
    'filter[ryYear]': params.ryYear,
    'filter[month]': params.month,
    'filter[status]': params.status,
    include: params.include?.join(','),
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/reports${qs}`, { schema: reportsPage });
}

export async function fetchReport(id: string, include: Array<'queries' | 'club'> = ['queries', 'club']): Promise<Report> {
  const qs = query({ include: include.join(',') });
  return apiFetch(`/reports/${encodeURIComponent(id)}${qs}`, { schema: reportSchema });
}

export async function createReport(input: { clubId: string; month: string }): Promise<Report> {
  return apiFetch('/reports', { method: 'POST', body: input, schema: reportSchema });
}

export interface UpdateReportInput {
  values?: Record<string, unknown>;
  notes?: string | null;
  status?: 'submitted';
}

export async function updateReport(id: string, input: UpdateReportInput): Promise<Report> {
  return apiFetch(`/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: reportSchema });
}

export async function fetchReportAssist(id: string): Promise<AssistResult> {
  return apiFetch(`/reports/${encodeURIComponent(id)}/assist`, { schema: assistResultSchema });
}

export async function addReportQuery(id: string, question: string): Promise<Report> {
  return apiFetch(`/reports/${encodeURIComponent(id)}/queries`, { method: 'POST', body: { question }, schema: reportSchema });
}

export async function replyReportQuery(id: string, queryId: string, reply: string): Promise<Report> {
  return apiFetch(`/reports/${encodeURIComponent(id)}/queries/${encodeURIComponent(queryId)}`, {
    method: 'PATCH',
    body: { reply },
    schema: reportSchema,
  });
}

const schemaListWithFields = z.object({ items: z.array(reportSchemaWithFieldsSchema) });
const schemaListSummary = z.object({ items: z.array(reportSchemaSummarySchema) });

export async function fetchActiveReportSchema(): Promise<ReportSchemaWithFields> {
  const res = await apiFetch('/report-schemas?include=fields', {
    schema: schemaListWithFields.transform((v) => v.items),
  });
  const active = res.find((s) => s.status === 'active') ?? res[0];
  if (!active) throw new Error('No active report schema is configured yet');
  return active;
}

export async function fetchReportSchemaVersion(version: number, withFields = true): Promise<ReportSchemaWithFields | null> {
  const qs = query({ 'filter[version]': version, include: withFields ? 'fields' : undefined });
  const res = await apiFetch(`/report-schemas${qs}`, { schema: schemaListWithFields.transform((v) => v.items) });
  return res[0] ?? null;
}

export async function fetchReportSchemas(): Promise<ReportSchemaSummary[]> {
  return apiFetch('/report-schemas', { schema: schemaListSummary.transform((v) => v.items) });
}

export async function createReportSchemaDraft(): Promise<ReportSchemaWithFields> {
  return apiFetch('/report-schemas', { method: 'POST', schema: reportSchemaWithFieldsSchema });
}

export interface ReportFieldInput {
  section: string;
  fieldKey: string;
  label: string;
  type: ReportSchemaWithFields['fields'][number]['type'];
  options?: unknown;
  required?: boolean;
  order: number;
  helpText?: string | null;
  perActivity?: boolean;
  pointSourceKey?: string | null;
}

export async function saveReportSchemaFields(version: number, fields: ReportFieldInput[]): Promise<ReportSchemaWithFields> {
  return apiFetch(`/report-schemas/${version}`, { method: 'PATCH', body: { fields }, schema: reportSchemaWithFieldsSchema });
}

export async function publishReportSchema(version: number): Promise<ReportSchemaWithFields> {
  return apiFetch(`/report-schemas/${version}`, { method: 'PATCH', body: { status: 'active' }, schema: reportSchemaWithFieldsSchema });
}

const requestList = z.object({ items: z.array(reportRequestSchema) });

export async function fetchReportRequests(): Promise<ReportRequest[]> {
  return apiFetch('/report-requests', { schema: requestList.transform((v) => v.items) });
}

export async function fetchReportRequest(id: string): Promise<ReportRequest> {
  return apiFetch(`/report-requests/${encodeURIComponent(id)}`, { schema: reportRequestSchema });
}

export interface CreateReportRequestInput {
  title: string;
  description?: string | null;
  questions: string[];
  audience: ReportRequestAudience;
  dueAt: string;
}

export async function createReportRequest(input: CreateReportRequestInput): Promise<ReportRequest> {
  return apiFetch('/report-requests', { method: 'POST', body: input, schema: reportRequestSchema });
}

export async function updateReportRequest(id: string, input: Partial<CreateReportRequestInput>): Promise<ReportRequest> {
  return apiFetch(`/report-requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: reportRequestSchema });
}

export async function deleteReportRequest(id: string): Promise<void> {
  await apiFetch(`/report-requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function putReportRequestResponse(
  requestId: string,
  clubId: string,
  answers: Record<string, unknown>,
): Promise<ReportRequestResponse> {
  return apiFetch(`/report-requests/${encodeURIComponent(requestId)}/responses/${encodeURIComponent(clubId)}`, {
    method: 'PUT',
    body: { answers },
    schema: reportRequestResponseSchema,
  });
}
