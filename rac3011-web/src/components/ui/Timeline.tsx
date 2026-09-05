import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TimelineState = 'done' | 'current' | 'todo';

export interface TimelineItem {
  title: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  state?: TimelineState;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const dotClass: Record<TimelineState, string> = {
  done: 'bg-accent',
  current: 'bg-accent ring-2 ring-offset-2 ring-accent',
  todo: 'bg-track',
};

const stateText: Record<TimelineState, string> = {
  done: 'Done',
  current: 'Current step',
  todo: 'Not started',
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative m-0 list-none p-0', className)}>
      {items.map((item, i) => {
        const state = item.state ?? 'todo';
        const isLast = i === items.length - 1;
        return (
          <li
            key={i}
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
            className="relative flex gap-3.5 pb-5 last:pb-0"
          >
            <div className="relative flex w-3 shrink-0 justify-center pt-1.5">
              <span aria-hidden className={cn('size-3 shrink-0 rounded-full', dotClass[state])} />
              {!isLast ? <span aria-hidden className="absolute top-5 bottom-[-20px] w-px bg-track" /> : null}
            </div>
            <div className="min-w-0 pb-0.5">
              <span className="sr-only">{stateText[state]}: </span>
              <span className="text-[13.5px] font-bold text-fg">{item.title}</span>
              {item.meta ? <div className="text-[11.5px] text-fg-3">{item.meta}</div> : null}
              {item.body ? <div className="pt-1 text-[13.5px] text-fg-2">{item.body}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
