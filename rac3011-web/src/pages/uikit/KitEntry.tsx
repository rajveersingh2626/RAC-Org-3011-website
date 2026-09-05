import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface KitEntryProps {
  name: string;
  note?: string;
  className?: string;
  children: ReactNode;
}

export function KitEntry({ name, note, className, children }: KitEntryProps) {
  return (
    <div className={cn('flex flex-col gap-2.5 rounded-[12px] border border-line bg-surface p-4', className)}>
      <p className="m-0 text-[10px] font-bold uppercase tracking-[0.08em] text-fg-3">
        {name}
        {note ? <span className="ml-1.5 font-normal normal-case tracking-normal text-fg-3">{note}</span> : null}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function KitGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

interface KitSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function KitSection({ title, description, children }: KitSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-[15.5px] font-extrabold text-fg">{title}</h2>
        {description ? <p className="m-0 mt-1 text-[11.5px] text-fg-2">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
