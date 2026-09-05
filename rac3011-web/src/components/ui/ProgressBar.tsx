import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: ReactNode;
  hint?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ value, max, label, hint, size = 'md', className }: ProgressBarProps) {
  const labelId = useId();
  const raw = max > 0 ? (value / max) * 100 : 0;
  const pct = Math.min(100, Math.max(0, raw));
  const vars = { ['--pct' as string]: `${pct}%` };

  return (
    <div className={cn('w-full', className)}>
      {label || hint ? (
        <div className="flex items-baseline justify-between gap-3 pb-1.5">
          {label ? (
            <span id={labelId} className="text-[13.5px] font-bold text-fg">
              {label}
            </span>
          ) : null}
          {hint ? <span className="text-[11.5px] tabular-nums text-fg-3">{hint}</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : 'Progress'}
        data-pct={pct}
        className={cn('w-full overflow-hidden rounded-[999px] bg-track', size === 'sm' ? 'h-1.5' : 'h-2.5')}
      >
        <div style={vars} aria-hidden className="h-full w-[var(--pct)] rounded-[999px] bg-accent transition-[width]" />
      </div>
    </div>
  );
}
