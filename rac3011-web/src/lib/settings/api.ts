import { apiFetch } from '@/lib/api';

export type SettingsMap = Record<string, unknown>;

export async function fetchSettings(): Promise<SettingsMap> {
  return apiFetch('/settings');
}

export async function updateSettings(patch: SettingsMap): Promise<SettingsMap> {
  return apiFetch('/settings', { method: 'PATCH', body: patch });
}
