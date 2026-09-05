import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type IconButtonVariant = 'ghost' | 'soft' | 'primary';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  label: string;
  variant?: IconButtonVariant;
}

const variantClass: Record<IconButtonVariant, string> = {
  ghost: 'text-fg-2 bg-transparent hover:bg-accent-soft',
  soft: 'bg-accent-soft text-accent-deep border border-line-accent',
  primary: 'bg-accent text-accent-fg shadow-button hover:bg-accent-hover',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', className, type = 'button', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      data-variant={variant}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] transition-colors select-none [&>svg]:size-[18px]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
