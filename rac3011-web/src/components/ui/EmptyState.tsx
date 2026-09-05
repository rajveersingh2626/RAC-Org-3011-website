import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, body, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3.5 rounded-[16px] border border-dashed border-line bg-surface px-5 py-10 text-center',
        className,
      )}
    >
      {icon ? <span aria-hidden className="text-accent">{icon}</span> : null}
      <p className="m-0 text-[15.5px] font-extrabold text-fg">{title}</p>
      {body ? <p className="m-0 max-w-[46ch] text-[13.5px] text-fg-2">{body}</p> : null}
      {action}
    </div>
  );
}
