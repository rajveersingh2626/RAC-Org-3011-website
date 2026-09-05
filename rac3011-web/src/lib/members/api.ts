import { apiFetch } from '@/lib/api';
import {
  directoryEntrySchema,
  importCommitResultSchema,
  importPreviewSchema,
  memberCardSchema,
  memberSchema,
  myClubSchema,
  paginatedSchema,
  skillTagSchema,
  type Member,
  type MemberStatus,
} from './types';

const membersPage = paginatedSchema(memberSchema);
const directoryPage = paginatedSchema(directoryEntrySchema);

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export interface RegisterMemberInput {
  fullName: string;
  email: string;
  password: string;
  clubId: string;
  phone?: string;
  rotaryId?: string;
}

export async function registerMember(input: RegisterMemberInput): Promise<{ id: string; status: string }> {
  return apiFetch('/members/register', { method: 'POST', body: input });
}

export interface MemberListParams {
  status?: MemberStatus;
  clubId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchMembers(params: MemberListParams = {}) {
  const qs = query({
    'filter[status]': params.status,
    'filter[clubId]': params.clubId,
    q: params.q,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/members${qs}`, { schema: membersPage });
}

export async function fetchMember(id: string): Promise<Member> {
  return apiFetch(`/members/${encodeURIComponent(id)}`, { schema: memberSchema });
}

export async function updateMemberStatus(
  id: string,
  input: { status: 'approved' | 'suspended'; rejectionReason?: string | null },
): Promise<Member> {
  return apiFetch(`/members/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: memberSchema });
}

export async function previewMemberImport(clubId: string, csv: string) {
  return apiFetch('/members/imports', { method: 'POST', body: { clubId, csv }, schema: importPreviewSchema });
}

export async function commitMemberImport(
  id: string,
  clubId: string,
  rows: { fullName: string; email: string; phone?: string | null; rotaryId?: string | null }[],
) {
  return apiFetch(`/members/imports/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { clubId, status: 'committed', rows },
    schema: importCommitResultSchema,
  });
}

export interface DirectoryParams {
  q?: string;
  skill?: string;
  interest?: string;
  clubId?: string;
  zoneId?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchDirectory(params: DirectoryParams = {}) {
  const qs = query({
    q: params.q,
    'filter[skill]': params.skill,
    'filter[interest]': params.interest,
    'filter[clubId]': params.clubId,
    'filter[zoneId]': params.zoneId,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/directory${qs}`, { schema: directoryPage });
}

export async function fetchSkillTags() {
  return apiFetch('/skill-tags', { schema: skillTagSchema.array() });
}

export async function acceptPrivacyPolicy(): Promise<{ accepted: true }> {
  return apiFetch('/me/privacy-acceptances', { method: 'POST' });
}

export async function fetchMyClub() {
  return apiFetch('/me/club', { schema: myClubSchema });
}

export async function fetchMyCard() {
  return apiFetch('/me/card', { schema: memberCardSchema });
}

export function qrSvgUrl(apiOrigin: string): string {
  return `${apiOrigin}/me/qr.svg`;
}
