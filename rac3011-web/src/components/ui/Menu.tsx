import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type MenuItem =
  | { id: string; label: ReactNode; onSelect: () => void; kbd?: string; disabled?: boolean; destructive?: boolean }
  | { type: 'separator'; id: string };

export interface MenuProps {
  label: ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
  triggerClassName?: string;
}

type Row = MenuItem;

function isSeparator(item: MenuItem): item is { type: 'separator'; id: string } {
  return 'type' in item && item.type === 'separator';
}

function ordered(items: MenuItem[]): Row[] {
  const normal = items.filter((i) => isSeparator(i) || !i.destructive);
  const destructive = items.filter((i): i is Extract<MenuItem, { onSelect: () => void }> => !isSeparator(i) && Boolean(i.destructive));
  while (normal.length > 0 && isSeparator(normal[normal.length - 1])) normal.pop();
  if (destructive.length === 0) return normal;
  return [...normal, { type: 'separator' as const, id: `${destructive[0].id}-sep` }, ...destructive];
}

export function Menu({ label, items, align = 'start', triggerClassName }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rows = useMemo(() => ordered(items), [items]);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  const enabled = rows.map((r, i) => (!isSeparator(r) && !r.disabled ? i : -1)).filter((i) => i >= 0);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) itemRefs.current[active]?.focus();
  }, [open, active]);

  const openWith = (index: number) => {
    setOpen(true);
    setActive(index);
  };

  const close = (restore: boolean) => {
    setOpen(false);
    setActive(-1);
    if (restore) triggerRef.current?.focus();
  };

  const move = (delta: number) => {
    if (enabled.length === 0) return;
    const at = enabled.indexOf(active);
    const next = at < 0 ? (delta > 0 ? 0 : enabled.length - 1) : (at + delta + enabled.length) % enabled.length;
    setActive(enabled[next]);
  };

  const jumpToLetter = (letter: string) => {
    const from = enabled.indexOf(active);
    const rotated = [...enabled.slice(from + 1), ...enabled.slice(0, from + 1)];
    const hit = rotated.find((i) => {
      const row = rows[i];
      return !isSeparator(row) && String(row.label).toLowerCase().startsWith(letter);
    });
    if (hit !== undefined) setActive(hit);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openWith(enabled[0] ?? -1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openWith(enabled[enabled.length - 1] ?? -1);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(enabled[0] ?? -1);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(enabled[enabled.length - 1] ?? -1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    } else if (event.key.length === 1 && /[a-z0-9]/i.test(event.key)) {
      jumpToLetter(event.key.toLowerCase());
    }
  };

  const select = (row: Row) => {
    if (isSeparator(row) || row.disabled) return;
    row.onSelect();
    close(true);
  };

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openWith(enabled[0] ?? -1))}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-line bg-surface px-3.5 text-[13.5px] font-bold text-fg-2 transition-colors hover:bg-accent-soft',
          triggerClassName,
        )}
      >
        {label}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={typeof label === 'string' ? label : undefined}
          data-align={align}
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute top-[calc(100%+6px)] z-40 min-w-[240px] rounded-[12px] border border-line bg-surface p-[6px] shadow-overlay',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {rows.map((row, index) =>
            isSeparator(row) ? (
              <div key={row.id} role="separator" className="my-[6px] h-px bg-[var(--border)]" />
            ) : (
              <button
                key={row.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                disabled={row.disabled}
                tabIndex={index === active ? 0 : -1}
                data-destructive={row.destructive || undefined}
                onClick={() => select(row)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-between gap-[14px] rounded-[8px] px-[14px] text-left text-[13.5px] transition-colors',
                  row.destructive ? 'text-danger-fg' : 'text-fg-2',
                  'hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <span>{row.label}</span>
                {row.kbd ? <span className="font-mono text-[11.5px] text-fg-3">{row.kbd}</span> : null}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
