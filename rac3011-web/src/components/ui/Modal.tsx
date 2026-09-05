import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { useFocusTrap, useScrollLock } from './useFocusTrap';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-[380px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[720px]',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  const downOnBackdrop = useRef(false);
  const titleId = useId();
  const descId = useId();

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
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        data-size={size}
        className={cn('w-full rounded-[16px] bg-surface p-[26px] shadow-overlay', sizeClass[size])}
      >
        <h2 id={titleId} className="text-[15.5px] font-extrabold text-fg">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-[9px] text-[13.5px] text-fg-2">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-[14px] text-[13.5px] text-fg-2">{children}</div> : null}
        {footer ? <div className="mt-[20px] flex flex-col gap-[9px] sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
