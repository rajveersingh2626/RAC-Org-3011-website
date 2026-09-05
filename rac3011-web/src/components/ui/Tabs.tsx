import { useCallback, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
  children?: ReactNode;
}

export function Tabs({ tabs, value, onChange, label, className, children }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = useCallback(
    (index: number) => {
      const next = tabs[index];
      if (!next) return;
      onChange(next.id);
      refs.current[next.id]?.focus();
    },
    [onChange, tabs],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = tabs.findIndex((t) => t.id === value);
    const at = current === -1 ? 0 : current;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      select((at + 1) % tabs.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      select((at - 1 + tabs.length) % tabs.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(tabs.length - 1);
    }
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-line">
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={onKeyDown}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap px-0.5 pb-2 text-[13.5px] font-bold transition-colors',
                selected ? 'border-b-2 border-accent text-accent' : 'border-b-2 border-transparent text-fg-2 hover:text-fg',
              )}
            >
              {tab.label}
              {tab.badge}
            </button>
          );
        })}
      </div>
      {children !== undefined && (
        <div role="tabpanel" id={`tabpanel-${value}`} aria-labelledby={`tab-${value}`} tabIndex={0} className="pt-5">
          {children}
        </div>
      )}
    </div>
  );
}
