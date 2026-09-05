import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
}

export const controlClass =
  'flex min-h-11 w-full items-center rounded-[8px] border border-line-accent bg-input px-[13px] text-[13px] text-fg outline-none transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-[var(--accent)]';
export const panelClass = 'absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-auto rounded-[8px] border border-accent bg-surface py-1 shadow-overlay';
export const optionClass = 'flex min-h-11 cursor-pointer items-center gap-2 px-[13px] py-[10px] text-[12.5px] text-fg-2';
export const optionActiveClass = 'bg-accent-soft font-semibold text-accent-deep';

export function filterOptions(options: ComboboxOption[], query: string): ComboboxOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q) || (o.hint?.toLowerCase().includes(q) ?? false));
}

export function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="ml-auto size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  { options, value, onChange, placeholder, label, disabled, emptyText = 'No matches', className },
  ref,
) {
  const id = useId();
  const listId = `${id}-listbox`;
  const selected = options.find((o) => o.value === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery(selected?.label ?? '');
  }, [selected, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = useMemo(() => filterOptions(options, open && query !== selected?.label ? query : ''), [options, query, open, selected]);

  const select = (opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
    setHighlight(-1);
  };

  const move = (delta: number) => {
    if (!open) setOpen(true);
    const n = filtered.length;
    if (n === 0) return;
    setHighlight((h) => (h < 0 ? (delta > 0 ? 0 : n - 1) : (h + delta + n) % n));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(1); break;
      case 'ArrowUp': e.preventDefault(); move(-1); break;
      case 'Home': if (open) { e.preventDefault(); setHighlight(0); } break;
      case 'End': if (open) { e.preventDefault(); setHighlight(filtered.length - 1); } break;
      case 'Enter': {
        if (!open) return;
        e.preventDefault();
        const opt = filtered[highlight];
        if (opt) select(opt);
        break;
      }
      case 'Escape':
        if (open) { e.preventDefault(); setOpen(false); setQuery(selected?.label ?? ''); }
        break;
    }
  };

  const activeId = open && highlight >= 0 && filtered[highlight] ? `${id}-opt-${filtered[highlight].value}` : undefined;

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <div className={cn(controlClass, disabled && 'cursor-not-allowed opacity-60')}>
        <input
          ref={ref}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-h-11 w-full flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3"
        />
      </div>
      {open && (
        <ul id={listId} role="listbox" aria-label={label} className={panelClass}>
          {filtered.length === 0 && <li className="px-[13px] py-[10px] text-[12.5px] text-fg-3">{emptyText}</li>}
          {filtered.map((opt, i) => {
            const isSel = opt.value === value;
            const isHi = i === highlight;
            return (
              <li
                key={opt.value}
                id={`${id}-opt-${opt.value}`}
                role="option"
                aria-selected={isSel}
                data-highlighted={isHi || undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(opt)}
                className={cn(optionClass, isHi && optionActiveClass)}
              >
                <span>{opt.label}</span>
                {opt.hint && <span className="text-[11px] text-fg-3">{opt.hint}</span>}
                {isSel && <CheckIcon />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
