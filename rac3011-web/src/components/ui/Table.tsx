import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  numeric?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: ReactNode;
  empty?: ReactNode;
  className?: string;
}

function headerLabel(header: ReactNode): string | undefined {
  return typeof header === 'string' || typeof header === 'number' ? String(header) : undefined;
}

export function Table<T>({ columns, rows, rowKey, caption, empty, className }: TableProps<T>) {
  return (
    <table className={cn('w-full border-collapse text-[13.5px] text-fg', className)}>
      {caption ? <caption className="pb-2 text-left text-[11.5px] text-fg-3">{caption}</caption> : null}
      <thead className="hidden border-t-2 border-accent md:table-header-group">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              className={cn(
                'px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-accent',
                col.align === 'right' || col.numeric ? 'text-right' : 'text-left',
              )}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y border-line">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-3 py-6 text-center text-fg-2">
              {empty}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={rowKey(row)} className="block border-t-2 border-accent md:table-row md:border-t-0">
              {columns.map((col) => (
                <td
                  key={col.key}
                  data-label={headerLabel(col.header)}
                  className={cn(
                    'flex items-baseline justify-between gap-3 px-3 py-1.5 md:table-cell md:py-2.5',
                    col.align === 'right' || col.numeric ? 'md:text-right' : 'md:text-left',
                    col.numeric && 'tabular-nums',
                  )}
                >
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-accent md:hidden">
                    {col.header}
                  </span>
                  <span>{col.cell(row)}</span>
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
