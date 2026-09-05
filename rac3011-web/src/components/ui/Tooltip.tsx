import { cloneElement, useId, useState, type ReactElement, type ReactNode } from 'react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement<Record<string, unknown>>;
}

// The child must be natively focusable, otherwise the tooltip is unreachable by keyboard.
export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const child = cloneElement(children, {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  });

  return (
    <span
      className="relative inline-flex"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      {child}
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-[calc(100%+6px)] left-1/2 z-40 w-max max-w-[260px] -translate-x-1/2 rounded-[8px] bg-portal-bar px-[9px] py-[6px] text-[11.5px] text-white shadow-overlay"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
