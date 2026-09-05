import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'pink' | 'green' | 'amber' | 'red' | 'blue';

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const toneClass: Record<BadgeTone, string> = {
  neutral:
    'bg-[var(--input-bg)] text-fg-2 border-line [[data-theme=dark]_&]:bg-[#1F1F24] [[data-theme=dark]_&]:text-[#C9C4C7] [[data-theme=dark]_&]:border-[#2C2C33]',
  pink:
    'bg-accent-soft text-accent-deep border-line-accent [[data-theme=dark]_&]:bg-[#2A1520] [[data-theme=dark]_&]:text-[#F7A8C4] [[data-theme=dark]_&]:border-[rgba(240,64,127,0.22)]',
  green:
    'bg-[#E7F5EE] text-[#0A5347] border-[#C7E7DA] [[data-theme=dark]_&]:bg-[#10281F] [[data-theme=dark]_&]:text-[#7FD0B4] [[data-theme=dark]_&]:border-[#1D4437]',
  amber:
    'bg-[#FDF3E3] text-[#8A5307] border-[#F0DDBB] [[data-theme=dark]_&]:bg-[#2B2110] [[data-theme=dark]_&]:text-[#E7B96A] [[data-theme=dark]_&]:border-[#4A3A1B]',
  red:
    'bg-[#FBEAEC] text-[#8A1027] border-[#EFC9CE] [[data-theme=dark]_&]:bg-[#2C1216] [[data-theme=dark]_&]:text-[#E58B98] [[data-theme=dark]_&]:border-[#4A1C24]',
  blue:
    'bg-[#EEF1FA] text-[#123499] border-[#CBD5EF] [[data-theme=dark]_&]:bg-[#121A2F] [[data-theme=dark]_&]:text-[#93A9E8] [[data-theme=dark]_&]:border-[#25325A]',
};

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1 rounded-[999px] border px-2.5 py-0.5 text-[11.5px] font-bold leading-[1.5] tracking-[0.2px]',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
