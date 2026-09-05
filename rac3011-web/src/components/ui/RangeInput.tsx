import { forwardRef, type CSSProperties, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface RangeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max'> {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  formatValue?: (value: number) => string;
}

const thumb =
  '[&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-raised ' +
  '[&::-moz-range-thumb]:size-[22px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[var(--accent)] [&::-moz-range-thumb]:bg-surface';

export const RangeInput = forwardRef<HTMLInputElement, RangeInputProps>(function RangeInput(
  { value, onChange, min, max, formatValue = String, className, disabled, ...rest },
  ref,
) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const style = { '--pct': `${pct}%` } as CSSProperties;
  return (
    <div data-range style={style} className={cn('flex flex-col gap-1', disabled && 'opacity-60', className)}>
      <span aria-hidden className="text-[28px] font-extrabold leading-none text-fg">
        {formatValue(value)}
      </span>
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'my-[11px] h-1.5 w-full min-h-0 cursor-pointer appearance-none rounded-full outline-none disabled:cursor-not-allowed',
          'bg-[linear-gradient(to_right,var(--accent)_var(--pct),var(--track)_var(--pct))]',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
          thumb,
        )}
        {...rest}
      />
      <div className="flex justify-between text-[10.5px] font-semibold text-fg-3">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
});
