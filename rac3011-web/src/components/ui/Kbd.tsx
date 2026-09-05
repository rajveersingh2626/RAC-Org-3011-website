import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface KbdProps {
  className?: string;
  children: ReactNode;
}

export function Kbd({ className, children }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-[20px] items-center justify-center rounded-[5px] border border-line bg-page px-1.5 py-0.5',
        'font-sans text-[11.5px] font-normal tabular-nums text-fg-3',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
