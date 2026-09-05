import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className, disabled, ...rest }, ref) {
  return (
    <label
      data-disabled={disabled || undefined}
      className={cn(
        'flex min-h-11 cursor-pointer select-none items-center gap-2.5 text-[12.5px] text-fg-2',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <input ref={ref} type="checkbox" disabled={disabled} className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className={cn(
          'flex size-[17px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-line-accent bg-input text-accent-fg transition-colors',
          'peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2',
          'peer-aria-[invalid=true]:border-danger [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100',
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span>{label}</span>
    </label>
  );
});
