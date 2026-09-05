import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'action' | 'warning' | 'error';

export interface AlertProps {
  tone?: AlertTone;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}

const toneClass: Record<AlertTone, string> = {
  info: 'bg-transparent border border-line',
  action: 'bg-accent-soft border border-line-accent',
  warning: 'bg-accent-soft border border-accent',
  error: 'bg-accent-soft border border-danger',
};

const titleClass: Record<AlertTone, string> = {
  info: 'text-fg',
  action: 'text-accent-deep',
  warning: 'text-accent-deep',
  error: 'text-danger-fg',
};

export function Alert({ tone = 'info', title, children, action }: AlertProps) {
  const live = tone === 'error' || tone === 'warning';
  return (
    <div
      role={live ? 'alert' : 'status'}
      data-tone={tone}
      className={cn('flex flex-col gap-[9px] rounded-[12px] p-[14px] sm:flex-row sm:items-start sm:justify-between', toneClass[tone])}
    >
      <div className="flex-1">
        <p className={cn('text-[13.5px] font-bold', titleClass[tone])}>{title}</p>
        {children ? <p className="mt-[2px] text-[11.5px] text-fg-2">{children}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
