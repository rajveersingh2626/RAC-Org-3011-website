import { useState } from 'react';
import { cn } from '@/lib/cn';

export interface FlagshipItem {
  title: string;
  summary: string;
}

interface FlagshipCarouselProps {
  items: FlagshipItem[];
}

export function FlagshipCarousel({ items }: FlagshipCarouselProps) {
  const [active, setActive] = useState(0);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 md:h-[360px] md:flex-row">
      {items.map((item, i) => {
        const expanded = i === active;
        return (
          <button
            key={item.title || i}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            aria-expanded={expanded}
            data-flagship-active={expanded || undefined}
            style={{ flexGrow: expanded ? 6 : 1 }}
            className={cn(
              'relative flex min-h-[120px] flex-col justify-end overflow-hidden rounded-[16px] border border-line-accent p-5 text-left transition-[flex-grow] duration-700 ease-in-out md:min-h-0',
              expanded ? 'bg-accent-soft' : 'bg-surface',
            )}
          >
            <h3 className="m-0 text-[15.5px] font-extrabold leading-tight text-fg">{item.title}</h3>
            <p
              className={cn(
                'm-0 mt-1.5 text-[13px] text-fg-2 transition-opacity duration-500',
                expanded ? 'opacity-100' : 'opacity-0 md:hidden',
              )}
            >
              {item.summary}
            </p>
          </button>
        );
      })}
    </div>
  );
}
