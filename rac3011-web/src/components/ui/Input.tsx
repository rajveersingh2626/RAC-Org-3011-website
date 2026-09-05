import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { useFieldControl } from './Field';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const controlClass =
  'block w-full min-h-11 rounded-[8px] border bg-input px-[13px] py-3 text-[13px] text-fg placeholder:text-fg-3 outline-none transition-colors ' +
  'focus:border-accent focus:ring-1 focus:ring-[var(--accent)] focus:bg-surface disabled:cursor-not-allowed disabled:opacity-60';

export function controlBorder(invalid: boolean): string {
  return invalid ? 'border-[1.5px] border-danger' : 'border-line-accent';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, type = 'text', ...rest }, ref) {
  const { invalid, ...linked } = useFieldControl(rest);
  return (
    <input
      ref={ref}
      type={type}
      {...rest}
      {...linked}
      data-invalid={invalid || undefined}
      className={cn(controlClass, controlBorder(invalid), className)}
    />
  );
});
