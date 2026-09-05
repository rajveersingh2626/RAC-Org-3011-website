import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ContainerWidth = 'default' | 'narrow' | 'wide';

export interface ContainerProps {
  as?: ElementType;
  width?: ContainerWidth;
  className?: string;
  children?: ReactNode;
}

const widthClass: Record<ContainerWidth, string> = {
  default: 'max-w-[1200px]',
  narrow: 'max-w-[760px]',
  wide: 'max-w-[1440px]',
};

export function Container({ as: Tag = 'div', width = 'default', className, children }: ContainerProps) {
  return (
    <Tag data-width={width} className={cn('mx-auto w-full px-5 md:px-8', widthClass[width], className)}>
      {children}
    </Tag>
  );
}
