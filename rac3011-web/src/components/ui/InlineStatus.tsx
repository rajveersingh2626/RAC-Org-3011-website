import type { ReactNode } from 'react';
import { Check, Loader, Lock, Unlink } from 'lucide-react';
import { cn } from '@/lib/cn';

export type InlineStatusState = 'checking' | 'ok' | 'broken' | 'private';

export interface InlineStatusProps {
  state: InlineStatusState;
  label?: ReactNode;
  className?: string;
}

const defaultLabel: Record<InlineStatusState, string> = {
  checking: 'Checking link…',
  ok: 'Link works',
  broken: 'Link is broken',
  private: 'Private — sign in to open',
};

const toneClass: Record<InlineStatusState, string> = {
  checking: 'text-fg-3',
  ok: 'text-[#0F7B6C] [[data-theme=dark]_&]:text-[#5FD3BC]',
  broken: 'text-danger-fg',
  private: 'text-fg-3',
};

const icons: Record<InlineStatusState, typeof Check> = {
  checking: Loader,
  ok: Check,
  broken: Unlink,
  private: Lock,
};

export function InlineStatus({ state, label, className }: InlineStatusProps) {
  const Icon = icons[state];
  return (
    <span
      data-state={state}
      className={cn('inline-flex items-center gap-1.5 text-[11.5px]', toneClass[state], className)}
    >
      <Icon aria-hidden className={cn('size-3.5 shrink-0', state === 'checking' && 'animate-pulse')} />
      {label ?? defaultLabel[state]}
    </span>
  );
}
