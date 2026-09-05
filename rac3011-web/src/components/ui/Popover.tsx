import { useEffect, useId, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { getFocusable } from './useFocusTrap';

export interface PopoverProps {
  label: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
}

export function Popover({ label, children, align = 'start' }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (panel) {
      const first = getFocusable(panel)[0];
      if (first) first.focus();
      else {
        panel.tabIndex = -1;
        panel.focus();
      }
    }
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const close = (restore: boolean) => {
    setOpen(false);
    if (restore) triggerRef.current?.focus();
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    if (open) setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative inline-block" onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-line bg-surface px-3.5 text-[13.5px] font-bold text-fg-2 transition-colors hover:bg-accent-soft"
      >
        {label}
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={typeof label === 'string' ? label : undefined}
          data-align={align}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close(true);
            }
          }}
          className={cn(
            'absolute top-[calc(100%+6px)] z-40 min-w-[220px] rounded-[12px] border border-line bg-surface p-[14px] text-[13.5px] text-fg-2 shadow-overlay',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
