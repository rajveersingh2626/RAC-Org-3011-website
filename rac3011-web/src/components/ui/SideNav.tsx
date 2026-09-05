import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SideNavItem {
  key: string;
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface SideNavGroup {
  label: string;
  items: SideNavItem[];
}

export interface SideNavProps {
  groups: SideNavGroup[];
  activeHref: string;
  label: string;
  className?: string;
}

export function SideNav({ groups, activeHref, label, className }: SideNavProps) {
  return (
    <nav aria-label={label} className={cn('flex flex-col gap-5 bg-portal-bar px-3 py-4', className)}>
      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <div key={group.label}>
            <p className="mb-1.5 px-2.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/50">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-center gap-2.5 rounded-[7px] px-2.5 text-[11.5px] transition-colors [&>svg]:size-[18px]',
                        active ? 'bg-white/[0.09] font-bold text-white' : 'font-semibold text-white/60 hover:bg-white/5',
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ),
      )}
    </nav>
  );
}
