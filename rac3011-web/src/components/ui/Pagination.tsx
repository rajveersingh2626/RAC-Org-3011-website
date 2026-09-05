import { cn } from '@/lib/cn';

export type PaginationEntry = number | 'ellipsis';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  label: string;
  className?: string;
}

export function paginationRange(page: number, totalPages: number): PaginationEntry[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const keep = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = Array.from(keep).sort((a, b) => a - b);
  const entries: PaginationEntry[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) entries.push('ellipsis');
    entries.push(p);
    previous = p;
  }
  return entries;
}

export function Pagination({ page, totalPages, onChange, label, className }: PaginationProps) {
  return (
    <nav aria-label={label} className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[8px] px-3.5 text-[12.5px] font-bold text-fg-2 transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          ← Previous
        </button>
        {paginationRange(page, totalPages).map((entry, index) =>
          entry === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} aria-hidden className="px-1 text-[12px] text-fg-3">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-current={entry === page ? 'page' : undefined}
              onClick={() => onChange(entry)}
              className={cn(
                'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[8px] px-2 text-[13px] font-bold transition-colors',
                entry === page ? 'bg-accent text-accent-fg' : 'border border-line-accent text-fg-2 hover:bg-accent-soft',
              )}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[8px] px-3.5 text-[12.5px] font-bold text-fg-2 transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
