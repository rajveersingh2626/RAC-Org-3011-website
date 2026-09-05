import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg shadow-button hover:bg-accent-hover',
  secondary: 'border-2 border-accent text-accent bg-transparent hover:bg-accent-soft',
  ghost: 'text-fg-2 bg-transparent hover:bg-accent-soft',
  danger: 'bg-danger text-white hover:opacity-90',
  link: 'text-accent bg-transparent px-0 hover:underline min-h-0',
  soft: 'bg-accent-soft text-accent-deep border border-line-accent',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3.5 py-2 text-[12.5px]',
  md: 'min-h-11 px-5 py-3 text-[13.5px]',
  lg: 'min-h-[52px] px-[26px] py-[15px] text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, leading, trailing, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[8px] font-bold transition-colors select-none',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        variant === 'link' ? 'text-[13.5px]' : sizeClass[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <span aria-hidden className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" /> : leading}
      {children}
      {!loading && trailing}
    </button>
  );
});
