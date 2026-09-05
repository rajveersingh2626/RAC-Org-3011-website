import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface KeyValueItem {
  label: ReactNode;
  value: ReactNode;
}

export interface KeyValueProps {
  items: KeyValueItem[];
  className?: string;
}

export function KeyValue({ items, className }: KeyValueProps) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-[max-content_1fr] sm:gap-y-2.5', className)}>
      {items.map((item, i) => (
        <div key={i} className="contents">
          <dt className="text-[11.5px] font-bold text-fg-3">{item.label}</dt>
          <dd className="m-0 text-[13.5px] text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
