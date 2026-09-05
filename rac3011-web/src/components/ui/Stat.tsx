import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type StatDeltaTone = 'up' | 'down' | 'neutral';

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  delta?: { text: string; tone: StatDeltaTone };
  className?: string;
}

const deltaClass: Record<StatDeltaTone, string> = {
  up: 'text-[#0A5347] [[data-theme=dark]_&]:text-[#7FD0B4]',
  down: 'text-danger [[data-theme=dark]_&]:text-[#E58B98]',
  neutral: 'text-fg-3',
};

export function Stat({ label, value, hint, delta, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-[9px] font-bold uppercase tracking-[1px] text-accent">{label}</span>
      <span className="text-[30px] font-extrabold leading-[1.1] text-fg">{value}</span>
      {(hint || delta) && (
        <span className="flex items-baseline gap-2 text-[11.5px]">
          {delta && (
            <span data-tone={delta.tone} className={cn('font-bold', deltaClass[delta.tone])}>
              {delta.text}
            </span>
          )}
          {hint && <span className="text-fg-3">{hint}</span>}
        </span>
      )}
    </div>
  );
}
