import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface LowResPortraitProps {
  src: string | null;
  alt: string;
  className?: string;
}

// Design rule: a low-resolution portrait renders at up to 160px but is never scaled past its
// natural size (would blur it further); a normal <img> with max-width does this natively.
export function LowResPortrait({ src, alt, className }: LowResPortraitProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        data-state={failed ? 'error' : 'empty'}
        className={cn(
          'flex size-[160px] flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-line bg-page text-center',
          className,
        )}
      >
        <ImageOff aria-hidden className="size-6 text-accent opacity-30" />
        <span className="text-[11px] text-fg-3">{failed ? 'Photo unavailable' : 'No photo on file'}</span>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex max-w-[160px] overflow-hidden rounded-[16px] border border-line-accent bg-page p-1', className)}>
      <img src={src} alt={alt} onError={() => setFailed(true)} className="block max-h-[152px] max-w-[152px] rounded-[12px] object-contain" />
    </div>
  );
}
