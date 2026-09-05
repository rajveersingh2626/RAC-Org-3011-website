import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError, onUnauthorized } from '@/lib/api';
import { meSchema, type Me, type Scope } from '@/lib/me';
import { can as canFn } from '@/lib/permissions';

interface AuthContextValue {
  me: Me | null;
  status: 'loading' | 'anonymous' | 'authenticated';
  can: (key: string, scope?: Scope) => boolean;
  refresh: () => Promise<Me | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export const ME_QUERY_KEY = ['me'] as const;

export async function fetchMe(): Promise<Me | null> {
  try {
    return await apiFetch('/me', { schema: meSchema });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [cleared, setCleared] = useState(false);
  const query = useQuery({ queryKey: ME_QUERY_KEY, queryFn: fetchMe, staleTime: 60_000, retry: false });

  useEffect(
    () =>
      onUnauthorized(() => {
        setCleared(true);
        qc.setQueryData(ME_QUERY_KEY, null);
      }),
    [qc],
  );

  const me = cleared && query.data === undefined ? null : (query.data ?? null);

  const refresh = useCallback(async () => {
    setCleared(false);
    const res = await qc.fetchQuery({ queryKey: ME_QUERY_KEY, queryFn: fetchMe, staleTime: 0 });
    return res;
  }, [qc]);

  const signOut = useCallback(async () => {
    await apiFetch('/auth/sign-out', { method: 'POST' }).catch(() => undefined);
    qc.setQueryData(ME_QUERY_KEY, null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  }, [qc]);

  const value = useMemo<AuthContextValue>(
    () => ({
      me,
      status: query.isPending && !cleared ? 'loading' : me ? 'authenticated' : 'anonymous',
      can: (key, scope) => canFn(me, key, scope),
      refresh,
      signOut,
    }),
    [me, query.isPending, cleared, refresh, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useMe(): Me | null {
  return useAuth().me;
}
