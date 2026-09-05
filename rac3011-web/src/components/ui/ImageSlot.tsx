import { useEffect, useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ImageRatio = '4:3' | '1:1' | '3:4';

export interface ImageSlotProps {
  src?: string | null;
  alt: string;
  ratio?: ImageRatio;
  prompt?: ReactNode;
  caption?: ReactNode;
  className?: string;
}

const ratioClass: Record<ImageRatio, string> = {
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
};

export function ImageSlot({ src, alt, ratio = '4:3', prompt, caption, className }: ImageSlotProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const box = cn('relative w-full overflow-hidden rounded-[16px]', ratioClass[ratio], className);

  if (!src || failed) {
    return (
      <figure className="w-full">
        <div
          data-state={failed ? 'error' : 'empty'}
          className={cn(box, 'flex flex-col items-center justify-center gap-2 border border-dashed border-line bg-page px-4 text-center')}
        >
          <ImageOff aria-hidden className="size-6 text-accent opacity-30" />
          <span className="text-[11.5px] text-fg-3">{failed ? 'Photo unavailable' : prompt}</span>
        </div>
        {caption ? <figcaption className="pt-1.5 text-[11.5px] text-fg-3">{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="w-full">
      <div data-state="filled" className={cn(box, 'bg-page')}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      {caption ? <figcaption className="pt-1.5 text-[11.5px] text-fg-3">{caption}</figcaption> : null}
    </figure>
  );
}
