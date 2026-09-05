import { forwardRef, useCallback, useState, type FormEvent, type FormHTMLAttributes } from 'react';
import type { z } from 'zod';
import { cn } from '@/lib/cn';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  submitting?: boolean;
}

export const Form = forwardRef<HTMLFormElement, FormProps>(function Form({ submitting, className, children, ...rest }, ref) {
  return (
    <form ref={ref} noValidate aria-busy={submitting || undefined} className={cn('flex flex-col gap-4', className)} {...rest}>
      {children}
    </form>
  );
});

export interface ServerErrorDetail {
  path: string;
  message: string;
}

export type FormErrors<T> = Partial<Record<keyof T & string, string>>;

export interface ZodForm<T extends Record<string, unknown>> {
  values: T;
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
  errors: FormErrors<T>;
  setServerErrors: (details: ServerErrorDetail[]) => void;
  handleSubmit: (onValid: (values: T) => void | Promise<void>) => (e: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  reset: () => void;
}

function toErrors<T>(issues: Array<{ path: PropertyKey[]; message: string }>): FormErrors<T> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (!(key in out)) out[key] = issue.message;
  }
  return out as FormErrors<T>;
}

export function useZodForm<TIn extends Record<string, unknown>, TOut>(schema: z.ZodType<TOut, TIn>, initial: TIn): ZodForm<TIn> {
  type T = TIn;
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [submitting, setSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (name in e ? { ...e, [name]: undefined } : e));
  }, []);

  const setServerErrors = useCallback((details: ServerErrorDetail[]) => {
    setErrors(toErrors<T>(details.map((d) => ({ path: d.path.split('.'), message: d.message }))));
  }, []);

  const handleSubmit = useCallback(
    (onValid: (values: T) => void | Promise<void>) => (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const result = schema.safeParse(values);
      if (!result.success) {
        setErrors(toErrors<T>(result.error.issues));
        return;
      }
      setErrors({});
      const outcome = onValid(values);
      if (outcome instanceof Promise) {
        setSubmitting(true);
        void outcome.finally(() => setSubmitting(false));
      }
    },
    [schema, values],
  );

  const reset = useCallback(() => {
    setValues(initial);
    setErrors({});
    setSubmitting(false);
  }, [initial]);

  return { values, setValue, errors, setServerErrors, handleSubmit, submitting, reset };
}
