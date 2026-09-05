import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, label, description, className, disabled, id, ...rest },
  ref,
) {
  const auto = useId();
  const labelId = label ? `${auto}-label` : undefined;
  const descId = description ? `${auto}-desc` : undefined;
  return (
    <div
      data-switch-row
      data-disabled={disabled || undefined}
      className={cn('flex min-h-11 items-center justify-between gap-3', disabled && 'opacity-60', className)}
    >
      {(label || description) && (
        <span className="flex min-w-0 flex-col">
          {label && (
            <span id={labelId} className="text-[12.5px] font-bold leading-tight text-fg">
              {label}
            </span>
          )}
          {description && (
            <span id={descId} className="text-[11px] leading-snug text-fg-3">
              {description}
            </span>
          )}
        </span>
      )}
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descId}
        disabled={disabled}
        data-state={checked ? 'on' : 'off'}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-[21px] w-[38px] shrink-0 rounded-full transition-colors disabled:cursor-not-allowed',
          checked ? 'bg-accent' : 'bg-track',
        )}
        {...rest}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-[2.5px] size-4 rounded-full bg-surface shadow-raised transition-transform',
            checked ? 'translate-x-[19.5px]' : 'translate-x-[2.5px]',
          )}
        />
      </button>
    </div>
  );
});
