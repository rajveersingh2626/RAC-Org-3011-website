import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  linkComponent?: ElementType;
  className?: string;
}

export function Breadcrumbs({ items, linkComponent: Link = 'a', className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-[11.5px]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden className="text-fg-3">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span aria-current={isLast ? 'page' : undefined} className={cn(isLast ? 'font-bold text-fg' : 'text-fg-2')}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="inline-flex min-h-11 items-center text-fg-2 hover:text-accent">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
