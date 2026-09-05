import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { CheckIcon, controlClass, filterOptions, optionActiveClass, optionClass, panelClass, type ComboboxOption } from './Combobox';

export interface MultiSelectProps {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
}

export function Chip({ label, onRemove, disabled }: { label: string; onRemove: () => void; disabled?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[5px] bg-accent-soft py-1 pl-2.5 pr-1 text-[11.5px] font-bold text-accent-deep">
      {label}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
        className="inline-flex size-6 items-center justify-center rounded-[4px] leading-none hover:bg-track disabled:cursor-not-allowed"
      >
        ×
      </button>
    </span>
  );
}

export const MultiSelect = forwardRef<HTMLInputElement, MultiSelectProps>(function MultiSelect(
  { options, values, onChange, placeholder, label, disabled, emptyText = 'No matches', className },
  ref,
) {
  const id = useId();
  const listId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => filterOptions(options, query), [options, query]);
  const selectedOpts = values.map((v) => options.find((o) => o.value === v)).filter((o): o is ComboboxOption => Boolean(o));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
    setQuery('');
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
        if (opt) toggle(opt.value);
        break;
      }
      case 'Backspace':
        if (query === '' && values.length > 0) onChange(values.slice(0, -1));
        break;
      case 'Escape':
        if (open) { e.preventDefault(); setOpen(false); }
        break;
    }
  };

  const activeId = open && highlight >= 0 && filtered[highlight] ? `${id}-opt-${filtered[highlight].value}` : undefined;

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <div className={cn(controlClass, 'flex-wrap gap-1.5 py-1.5', disabled && 'cursor-not-allowed opacity-60')}>
        {selectedOpts.map((o) => (
          <Chip key={o.value} label={o.label} disabled={disabled} onRemove={() => toggle(o.value)} />
        ))}
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
          placeholder={values.length === 0 ? placeholder : undefined}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-h-7 min-w-16 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3"
        />
      </div>
      {open && (
        <ul id={listId} role="listbox" aria-label={label} aria-multiselectable="true" className={panelClass}>
          {filtered.length === 0 && <li className="px-[13px] py-[10px] text-[12.5px] text-fg-3">{emptyText}</li>}
          {filtered.map((opt, i) => {
            const isSel = values.includes(opt.value);
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
                onClick={() => toggle(opt.value)}
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
