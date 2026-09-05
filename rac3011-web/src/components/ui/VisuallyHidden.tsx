import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface VisuallyHiddenProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function VisuallyHidden({ as: Tag = 'span', className, children }: VisuallyHiddenProps) {
  return <Tag className={cn('sr-only', className)}>{children}</Tag>;
}
