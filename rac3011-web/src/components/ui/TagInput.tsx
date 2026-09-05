import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { controlClass, optionActiveClass, optionClass, panelClass } from './Combobox';
import { Chip } from './MultiSelect';

export interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(function TagInput(
  { values, onChange, suggestions = [], maxTags, placeholder, label, disabled, className },
  ref,
) {
  const id = useId();
  const listId = `${id}-listbox`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const full = maxTags !== undefined && values.length >= maxTags;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return suggestions.filter((s) => s.toLowerCase().includes(q) && !values.includes(s));
  }, [suggestions, query, values]);
  const showList = open && filtered.length > 0 && !full;

  useEffect(() => {
    if (!showList) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showList]);

  const add = (raw: string) => {
    const tag = raw.trim();
    setQuery('');
    setHighlight(-1);
    if (!tag || values.includes(tag) || full) return;
    onChange([...values, tag]);
  };

  const move = (delta: number) => {
    const n = filtered.length;
    if (n === 0) return;
    setOpen(true);
    setHighlight((h) => (h < 0 ? (delta > 0 ? 0 : n - 1) : (h + delta + n) % n));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(1); break;
      case 'ArrowUp': e.preventDefault(); move(-1); break;
      case 'Enter':
      case ',': {
        e.preventDefault();
        const pick = showList ? filtered[highlight] : undefined;
        add(pick ?? query);
        break;
      }
      case 'Backspace':
        if (query === '' && values.length > 0) onChange(values.slice(0, -1));
        break;
      case 'Escape':
        if (showList) { e.preventDefault(); setOpen(false); }
        break;
    }
  };

  const activeId = showList && highlight >= 0 ? `${id}-opt-${highlight}` : undefined;

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <div className={cn(controlClass, 'flex-wrap gap-1.5 py-1.5', disabled && 'cursor-not-allowed opacity-60')}>
        {values.map((v) => (
          <Chip key={v} label={v} disabled={disabled} onRemove={() => onChange(values.filter((x) => x !== v))} />
        ))}
        <input
          ref={ref}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          disabled={disabled}
          placeholder={values.length === 0 ? placeholder : undefined}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(-1); }}
          onKeyDown={onKeyDown}
          className="min-h-7 min-w-16 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-3 disabled:cursor-not-allowed"
        />
      </div>
      {showList && (
        <ul id={listId} role="listbox" aria-label={label} className={panelClass}>
          {filtered.map((s, i) => (
            <li
              key={s}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={false}
              data-highlighted={i === highlight || undefined}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => add(s)}
              className={cn(optionClass, i === highlight && optionActiveClass)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
