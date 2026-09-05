import { createContext, useContext, useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | undefined>(undefined);

export function useField(): FieldContextValue | undefined {
  return useContext(FieldContext);
}

export function useFieldControl(props: { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling' }) {
  const field = useField();
  return {
    id: props.id ?? field?.id,
    'aria-describedby': props['aria-describedby'] ?? field?.describedBy,
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid ? true : undefined),
    invalid: props['aria-invalid'] === true || props['aria-invalid'] === 'true' || Boolean(field?.invalid),
  };
}

export interface FieldProps {
  label: ReactNode;
  id?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({ label, id, required, hint, error, className, children }: FieldProps) {
  const auto = useId();
  const controlId = id ?? `${auto}-control`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const invalid = Boolean(error);
  return (
    <div data-field data-invalid={invalid || undefined} className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={controlId} className="text-[12px] font-bold leading-tight text-fg">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-accent">*</span>
            <span className="sr-only"> required</span>
          </>
        )}
      </label>
      {hint && (
        <p id={hintId} className="-mt-0.5 text-[11.5px] leading-snug text-fg-3">
          {hint}
        </p>
      )}
      <FieldContext.Provider value={{ id: controlId, describedBy, invalid }}>{children}</FieldContext.Provider>
      {error && (
        <p id={errorId} role="alert" className="text-[11px] font-semibold leading-snug text-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}
