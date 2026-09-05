import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClass: Record<AvatarSize, string> = {
  sm: 'size-[26px] text-[9px]',
  md: 'size-[34px] text-[12px]',
  lg: 'size-11 text-[16px]',
  xl: 'size-[56px] text-[20px]',
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const base = cn('shrink-0 overflow-hidden rounded-full border border-line-accent', sizeClass[size], className);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        data-size={size}
        onError={() => setFailed(true)}
        className={cn(base, 'object-cover')}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      data-size={size}
      className={cn(base, 'inline-flex select-none items-center justify-center bg-accent-soft font-extrabold leading-none text-accent-deep')}
    >
      {initialsOf(name)}
    </span>
  );
}
