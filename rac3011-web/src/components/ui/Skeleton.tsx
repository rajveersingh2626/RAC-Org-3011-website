import { cn } from '@/lib/cn';

export type SkeletonShape = 'text' | 'circle' | 'rect';

export interface SkeletonProps {
  shape?: SkeletonShape;
  lines?: number;
  className?: string;
}

const shapeClass: Record<SkeletonShape, string> = {
  text: 'h-2 rounded-[4px]',
  circle: 'size-11 rounded-full',
  rect: 'h-[72px] rounded-[12px]',
};

export function Skeleton({ shape = 'text', lines = 1, className }: SkeletonProps) {
  const count = shape === 'text' ? Math.max(1, lines) : 1;

  if (shape === 'text' && count > 1) {
    return (
      <div aria-hidden="true" className={cn('flex animate-pulse flex-col gap-1.5', className)}>
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            data-shape="text"
            className={cn('block bg-track', shapeClass.text, i === count - 1 && 'w-[65%]')}
          />
        ))}
      </div>
    );
  }

  return <div aria-hidden="true" data-shape={shape} className={cn('animate-pulse bg-track', shapeClass[shape], className)} />;
}
