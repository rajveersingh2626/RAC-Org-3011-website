import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { useFieldControl } from './Field';
import { controlBorder, controlClass } from './Input';

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput({ className, value, onChange, ...rest }, ref) {
  const { invalid, ...linked } = useFieldControl(rest);
  return (
    <input
      ref={ref}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
      {...linked}
      data-invalid={invalid || undefined}
      className={cn(controlClass, controlBorder(invalid), 'appearance-none [&::-webkit-calendar-picker-indicator]:cursor-pointer', className)}
    />
  );
});
