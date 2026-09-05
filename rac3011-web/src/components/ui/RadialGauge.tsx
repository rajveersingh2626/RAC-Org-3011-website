import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface RadialGaugeProps {
  value: number;
  max: number;
  size?: number;
  label?: ReactNode;
  sublabel?: ReactNode;
  className?: string;
}

export function RadialGauge({ value, max, size = 120, label, sublabel, className }: RadialGaugeProps) {
  const raw = max > 0 ? (value / max) * 100 : 0;
  const pct = Math.min(100, Math.max(0, raw));
  const vars = { ['--pct' as string]: `${pct}%`, ['--size' as string]: `${size}px` };

  return (
    <div
      role="img"
      aria-label={`${value.toLocaleString('en-IN')} of ${max.toLocaleString('en-IN')}`}
      data-pct={pct}
      style={vars}
      className={cn('inline-flex flex-col items-center gap-2', className)}
    >
      <div
        aria-hidden
        className="relative grid size-[var(--size)] place-items-center rounded-full bg-[conic-gradient(var(--accent)_var(--pct),var(--track)_0)]"
      >
        <div className="grid size-[78%] place-items-center rounded-full bg-surface text-center">
          <span className="text-[15.5px] font-extrabold tabular-nums text-fg">{label ?? value.toLocaleString('en-IN')}</span>
        </div>
      </div>
      {sublabel ? <span aria-hidden className="text-[11.5px] text-fg-3">{sublabel}</span> : null}
    </div>
  );
}
