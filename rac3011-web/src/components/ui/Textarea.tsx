import { forwardRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { useFieldControl } from './Field';
import { controlBorder, controlClass } from './Input';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, maxLength, onChange, value, defaultValue, rows = 4, ...rest },
  ref,
) {
  const { invalid, ...linked } = useFieldControl(rest);
  const [innerLength, setInnerLength] = useState(String(defaultValue ?? '').length);
  const length = value !== undefined ? String(value).length : innerLength;
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInnerLength(e.target.value.length);
    onChange?.(e);
  };
  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={ref}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        {...rest}
        {...linked}
        data-invalid={invalid || undefined}
        className={cn(controlClass, controlBorder(invalid), 'resize-none leading-relaxed', className)}
      />
      {maxLength !== undefined && (
        <span aria-live="polite" className="self-end text-[11px] text-fg-3">
          {length} / {maxLength}
        </span>
      )}
    </div>
  );
});
