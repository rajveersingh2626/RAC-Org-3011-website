import type { z } from 'zod';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: { path: string; message: string }[];
  constructor(status: number, message: string, extra?: { code?: string; details?: { path: string; message: string }[] }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = extra?.code;
    this.details = extra?.details;
  }
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();
export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export const API_ORIGIN: string = (import.meta.env.VITE_API_ORIGIN as string | undefined) ?? '';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
interface Options<T> {
  method?: Method;
  body?: unknown;
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiFetch<T = unknown>(path: string, opts: Options<T> = {}): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  const data = await readBody(res);
  if (!res.ok) {
    if (res.status === 401) unauthorizedListeners.forEach((l) => l());
    const obj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
    const message = typeof obj.message === 'string' ? obj.message : typeof obj.error === 'string' ? obj.error : res.statusText || `HTTP ${res.status}`;
    throw new ApiError(res.status, message, {
      code: typeof obj.code === 'string' ? obj.code : undefined,
      details: Array.isArray(obj.details) ? (obj.details as { path: string; message: string }[]) : undefined,
    });
  }
  if (opts.schema) {
    const parsed = opts.schema.safeParse(data);
    if (!parsed.success) throw new ApiError(500, `Unexpected response shape from ${path}`);
    return parsed.data;
  }
  return data as T;
}
