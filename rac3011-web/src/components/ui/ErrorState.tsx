import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/cn';

export interface ErrorStateProps {
  title?: ReactNode;
  body?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  body,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-2.5 rounded-[16px] border border-danger bg-surface px-5 py-5 text-left',
        className,
      )}
    >
      <p className="m-0 flex items-center gap-2 text-[15.5px] font-extrabold text-fg">
        <TriangleAlert aria-hidden className="size-4 shrink-0 text-danger" />
        {title}
      </p>
      {body ? <p className="m-0 text-[13.5px] text-fg-2">{body}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} className="min-h-11">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
