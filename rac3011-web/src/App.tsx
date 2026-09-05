import { lazy, Suspense } from 'react';
import { Providers } from '@/app/providers';
import { resolveSurface, type Surface } from '@/app/host';
import { SurfaceLoading } from '@/app/routes/SurfaceLoading';

// One lazy chunk per surface: a visitor to any single hostname downloads only that
// surface's route tree, never the other five. Public pages inside each tree stay eager.
const SURFACE_APPS: Record<Surface, ReturnType<typeof lazy>> = {
  main: lazy(() => import('@/app/routes/MainSurfaceApp')),
  mission3011: lazy(() => import('@/app/routes/Mission3011SurfaceApp')),
  drishti: lazy(() => import('@/app/routes/DrishtiSurfaceApp')),
  rcl: lazy(() => import('@/app/routes/RclSurfaceApp')),
  careerbridge: lazy(() => import('@/app/routes/CareerbridgeSurfaceApp')),
  ride: lazy(() => import('@/app/routes/RideSurfaceApp')),
};

export function App() {
  const surface = resolveSurface(window.location.hostname, window.location.search);
  const SurfaceApp = SURFACE_APPS[surface];

  return (
    <Providers>
      <Suspense fallback={<SurfaceLoading />}>
        <SurfaceApp />
      </Suspense>
    </Providers>
  );
}
