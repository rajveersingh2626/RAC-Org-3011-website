import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type CardTone = 'plain' | 'action' | 'dashed';

export interface CardProps {
  as?: ElementType;
  tone?: CardTone;
  eyebrow?: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
}

const toneClass: Record<CardTone, string> = {
  plain: 'bg-surface border border-line-accent shadow-raised',
  action: 'bg-accent-soft border border-accent',
  dashed: 'bg-transparent border border-dashed border-line',
};

export function Card({ as = 'div', tone = 'plain', eyebrow, title, footer, children, className, href, target, rel }: CardProps) {
  const Tag = as;
  return (
    <Tag
      data-tone={tone}
      href={href}
      target={target}
      rel={rel}
      className={cn('rounded-[16px] p-5', toneClass[tone], href && 'transition-colors hover:border-accent', className)}
    >
      {eyebrow && <p className="m-0 mb-1.5 text-[10px] font-extrabold uppercase tracking-[1.2px] text-[#123499]">{eyebrow}</p>}
      {title && <h3 className="m-0 text-[15.5px] font-extrabold leading-[1.35] text-fg">{title}</h3>}
      {children && <div className={cn('text-[13.5px] text-fg-2', Boolean(title || eyebrow) && 'mt-2')}>{children}</div>}
      {footer && <div className="mt-3.5 flex flex-wrap items-center gap-2.5">{footer}</div>}
    </Tag>
  );
}
