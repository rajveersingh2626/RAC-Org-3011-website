import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SectionProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  as?: ElementType;
  headingLevel?: 2 | 3 | 4;
  className?: string;
  children?: ReactNode;
}

export function Section({
  eyebrow,
  title,
  description,
  action,
  as: Tag = 'section',
  headingLevel = 2,
  className,
  children,
}: SectionProps) {
  const Heading = `h${headingLevel}` as ElementType;
  const hasHeader = Boolean(eyebrow || title || description || action);
  return (
    <Tag className={cn('py-10', className)}>
      {hasHeader && (
        <div className="mb-6 flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrow && <p className="m-0 mb-1.5 text-[9px] font-bold uppercase tracking-[1px] text-accent">{eyebrow}</p>}
            {title && <Heading className="m-0 text-[27px] font-extrabold leading-tight text-fg">{title}</Heading>}
            {description && <p className="m-0 mt-2 max-w-[60ch] text-[13.5px] text-fg-2">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}
