import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { useFocusTrap, useScrollLock } from './useFocusTrap';

export type DrawerSide = 'left' | 'right' | 'bottom';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  side?: DrawerSide;
  children?: ReactNode;
  footer?: ReactNode;
}

const sideClass: Record<DrawerSide, string> = {
  left: 'inset-y-0 left-0 h-full w-full max-w-[360px] rounded-r-[16px]',
  right: 'inset-y-0 right-0 h-full w-full max-w-[360px] rounded-l-[16px]',
  bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-[16px]',
};

export function Drawer({ open, onClose, title, side = 'right', children, footer }: DrawerProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  const downOnBackdrop = useRef(false);
  const titleId = useId();

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    downOnBackdrop.current = event.target === event.currentTarget;
  };
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (downOnBackdrop.current && event.target === event.currentTarget) onClose();
    downOnBackdrop.current = false;
  };

  return createPortal(
    <div data-testid="drawer-backdrop" className="fixed inset-0 z-50 bg-black/40" onMouseDown={onMouseDown} onClick={onClick}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-side={side}
        className={cn(
          'fixed flex flex-col overflow-y-auto bg-surface p-[20px] shadow-overlay transition-transform duration-200 translate-x-0 translate-y-0',
          sideClass[side],
        )}
      >
        <h2 id={titleId} className="text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
          {title}
        </h2>
        <div className="mt-[14px] flex-1 text-[13.5px] text-fg-2">{children}</div>
        {footer ? <div className="mt-[20px] flex flex-col gap-[9px]">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
