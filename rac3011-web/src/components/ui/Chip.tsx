import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selected?: boolean;
  count?: number;
  label?: string;
  onRemove?: () => void;
  children?: ReactNode;
}

function textOf(label: string | undefined, children: ReactNode): string {
  if (label !== undefined) return label;
  return typeof children === 'string' ? children : '';
}

function chipClass(selected: boolean | undefined, disabled: boolean | undefined, className: string | undefined): string {
  return cn(
    'inline-flex min-h-11 select-none items-center gap-1.5 rounded-[5px] border px-3 text-[12.5px] font-bold transition-colors',
    selected ? 'bg-accent border-accent text-accent-fg' : 'bg-transparent border-line-accent text-fg-2 hover:bg-accent-soft',
    disabled && 'cursor-not-allowed opacity-60',
    className,
  );
}

function CountBadge({ count, selected }: { count: number; selected: boolean | undefined }) {
  return (
    <span
      className={cn(
        'rounded-[999px] px-1.5 text-[11.5px] font-bold',
        selected ? 'bg-[rgba(255,255,255,0.22)] text-accent-fg' : 'bg-track text-accent-deep',
      )}
    >
      {count}
    </span>
  );
}

export function Chip({ selected, count, label, onRemove, children, className, disabled, type = 'button', ...rest }: ChipProps) {
  const name = textOf(label, children);

  if (onRemove) {
    // Plain span, not a <button>: a <button> nested inside the outer control would be an
    // invalid nested-interactive pattern (fails axe's nested-interactive rule).
    return (
      <span className={chipClass(selected, disabled, className)}>
        <span>{label ?? children}</span>
        {count !== undefined && <CountBadge count={count} selected={selected} />}
        <button
          type="button"
          disabled={disabled}
          aria-label={`Remove ${name}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
          className="inline-flex size-6 items-center justify-center rounded-[4px] leading-none hover:bg-[rgba(0,0,0,0.08)]"
        >
          ×
        </button>
      </span>
    );
  }

  return (
    <button
      type={type}
      aria-pressed={!!selected}
      disabled={disabled}
      data-selected={selected || undefined}
      className={chipClass(selected, disabled, className)}
      {...rest}
    >
      <span>{label ?? children}</span>
      {count !== undefined && <CountBadge count={count} selected={selected} />}
    </button>
  );
}
