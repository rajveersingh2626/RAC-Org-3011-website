import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ label, className, disabled, ...rest }, ref) {
  return (
    <label
      data-disabled={disabled || undefined}
      className={cn(
        'flex min-h-11 cursor-pointer select-none items-center gap-2.5 text-[12.5px] text-fg-2',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <input ref={ref} type="radio" disabled={disabled} className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className={cn(
          'flex size-[17px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-accent bg-input transition-colors',
          'peer-checked:border-accent peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2',
          'after:size-2 after:rounded-full after:bg-accent after:opacity-0 after:content-[""] peer-checked:after:opacity-100',
        )}
      />
      <span>{label}</span>
    </label>
  );
});

export interface RadioOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  legend: ReactNode;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  error?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function RadioGroup({ legend, name, value, onChange, options, error, hint, disabled, className }: RadioGroupProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      disabled={disabled}
      className={cn('m-0 min-w-0 border-0 p-0', className)}
    >
      <legend className="mb-0.5 p-0 text-[12px] font-bold text-fg">{legend}</legend>
      {hint && (
        <p id={hintId} className="text-[11.5px] leading-snug text-fg-3">
          {hint}
        </p>
      )}
      {options.map((o) => (
        <Radio
          key={o.value}
          name={name}
          value={o.value}
          label={o.label}
          disabled={o.disabled}
          checked={value === o.value}
          onChange={() => onChange(o.value)}
        />
      ))}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] font-semibold leading-snug text-danger-fg">
          {error}
        </p>
      )}
    </fieldset>
  );
}
