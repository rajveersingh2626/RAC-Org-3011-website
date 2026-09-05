import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface DividerProps {
  label?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const fadeRight = 'bg-gradient-to-r from-transparent via-[var(--border)] to-transparent';
const fadeDown = 'bg-gradient-to-b from-transparent via-[var(--border)] to-transparent';

export function Divider({ label, orientation = 'horizontal', className }: DividerProps) {
  if (!label) {
    return (
      <div
        role="separator"
        aria-orientation={orientation}
        className={cn(orientation === 'vertical' ? cn('h-full w-px', fadeDown) : cn('h-px w-full', fadeRight), className)}
      />
    );
  }
  if (orientation === 'vertical') {
    return (
      <div className={cn('flex h-full flex-col items-center gap-2.5', className)}>
        <span aria-hidden className={cn('w-px flex-1', fadeDown)} />
        <span className="text-[9px] font-bold uppercase tracking-[1px] text-accent [writing-mode:vertical-rl]">{label}</span>
        <span aria-hidden className={cn('w-px flex-1', fadeDown)} />
      </div>
    );
  }
  return (
    <div className={cn('flex w-full items-center gap-3.5', className)}>
      <span aria-hidden className={cn('h-px flex-1', fadeRight)} />
      <span className="text-[9px] font-bold uppercase tracking-[1px] text-accent">{label}</span>
      <span aria-hidden className={cn('h-px flex-1', fadeRight)} />
    </div>
  );
}
