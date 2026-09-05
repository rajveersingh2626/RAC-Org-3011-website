import { Skeleton } from '@/components/ui/Skeleton';

export function SurfaceLoading() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-16">
      <Skeleton shape="rect" className="h-40" />
    </div>
  );
}
