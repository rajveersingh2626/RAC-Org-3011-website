import { useCallback, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, label, className }: SegmentedControlProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = useCallback(
    (index: number) => {
      const next = options[index];
      if (!next) return;
      onChange(next.value);
      refs.current[next.value]?.focus();
    },
    [onChange, options],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = options.findIndex((o) => o.value === value);
    const at = current === -1 ? 0 : current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      select((at + 1) % options.length);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      select((at - 1 + options.length) % options.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(options.length - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-overflow={options.length > 4 ? 'scroll' : undefined}
      className={cn('inline-flex max-w-full flex-nowrap gap-1.5 overflow-x-auto rounded-[8px] p-1', className)}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[option.value] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={onKeyDown}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-[5px] px-4 text-[12.5px] font-bold transition-colors',
              checked ? 'bg-accent text-accent-fg' : 'border border-line bg-transparent text-fg-2 hover:bg-accent-soft',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
