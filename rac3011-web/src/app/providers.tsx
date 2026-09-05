import { useCallback, useMemo, type ReactNode } from 'react';
import { QueryClient, defaultShouldDehydrateQuery, type Query } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthProvider, useAuth } from './auth';
import { ThemeProvider, type ThemePreference } from './theme';
import { ToastProvider } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { createLocalStoragePersister } from '@/lib/queryPersister';
import { LIVE_QUERY_KEY } from '@/lib/publicApi/live';
import { exposeQueryClientForPrerender, hydratePrerenderedState } from './prerender';

export { useAuth, useMe } from './auth';
export { useTheme } from './theme';

// Build SHA busts the persisted cache on every deploy so a stale shape never survives a release.
export const BUILD_SHA: string = (import.meta.env.VITE_BUILD_SHA as string | undefined) ?? 'dev';
const PERSIST_MAX_AGE_MS = 24 * 60 * 60_000;

export function createQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 24 * 60 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
  hydratePrerenderedState(client);
  exposeQueryClientForPrerender(client, shouldPersistQuery);
  return client;
}

function isLiveQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey.length === LIVE_QUERY_KEY.length && queryKey.every((part, i) => part === LIVE_QUERY_KEY[i]);
}

// Public queries only, so `signOut`'s `removeQueries` stays a complete wipe of private data.
export function shouldPersistQuery(query: Query): boolean {
  return defaultShouldDehydrateQuery(query) && query.queryKey[0] === 'public' && !isLiveQueryKey(query.queryKey);
}

function ThemeFromProfile({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const rawPref = me?.profile?.themePreference ?? me?.theme ?? null;
  const pref: ThemePreference = rawPref === 'dark' ? 'dark' : 'light';
  const persist = useCallback(
    (p: ThemePreference) => {
      if (!me) return;
      void apiFetch('/me', { method: 'PATCH', body: { themePreference: p } }).catch(() => undefined);
    },
    [me],
  );
  return (
    <ThemeProvider profilePreference={pref} onPersist={persist}>
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children, queryClient }: { children: ReactNode; queryClient?: QueryClient }) {
  const client = useMemo(() => queryClient ?? createQueryClient(), [queryClient]);
  const persistOptions = useMemo(
    () => ({
      persister: createLocalStoragePersister(),
      buster: BUILD_SHA,
      maxAge: PERSIST_MAX_AGE_MS,
      dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
    }),
    [],
  );

  return (
    <PersistQueryClientProvider client={client} persistOptions={persistOptions}>
      <AuthProvider>
        <ThemeFromProfile>
          <ToastProvider>{children}</ToastProvider>
        </ThemeFromProfile>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
