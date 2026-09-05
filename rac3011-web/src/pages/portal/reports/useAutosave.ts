import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface UseAutosaveResult {
  status: AutosaveStatus;
  error: string | null;
  flush: () => void;
}

const DEBOUNCE_MS = 10_000;

// Debounces a save call by DEBOUNCE_MS after every change, flushing immediately on blur/unmount/manual flush.
export function useAutosave<T>(value: T, save: (value: T) => Promise<unknown>, enabled = true): UseAutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestValue = useRef(value);
  const savedValue = useRef(value);
  const saveRef = useRef(save);
  saveRef.current = save;
  latestValue.current = value;

  const runSave = useCallback(() => {
    clearTimeout(timer.current);
    if (savedValue.current === latestValue.current) return;
    const toSave = latestValue.current;
    setStatus('saving');
    saveRef.current(toSave)
      .then(() => {
        savedValue.current = toSave;
        setStatus('saved');
        setError(null);
      })
      .catch((e: unknown) => {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Save failed');
      });
  }, []);

  useEffect(() => {
    if (!enabled || value === savedValue.current) return;
    setStatus('pending');
    clearTimeout(timer.current);
    timer.current = setTimeout(runSave, DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [value, enabled, runSave]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { status, error, flush: runSave };
}
