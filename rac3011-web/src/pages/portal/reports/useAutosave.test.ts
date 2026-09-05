import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { useAutosave } from './useAutosave';

describe('useAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('saves automatically 10s after a change', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(({ value }) => useAutosave(value, save), { initialProps: { value: { a: 1 } } });

    expect(result.current.status).toBe('idle');
    rerender({ value: { a: 2 } });
    expect(result.current.status).toBe('pending');
    expect(save).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(save).toHaveBeenCalledWith({ a: 2 });
  });

  it('flush() saves immediately without waiting for the debounce', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(({ value }) => useAutosave(value, save), { initialProps: { value: { a: 1 } } });
    rerender({ value: { a: 2 } });

    await act(async () => {
      result.current.flush();
    });
    expect(save).toHaveBeenCalledWith({ a: 2 });
  });

  it('does not save when nothing changed', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(({ value }) => useAutosave(value, save), { initialProps: { value: { a: 1 } } });
    await act(async () => {
      result.current.flush();
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('reports an error status when the save rejects', async () => {
    const save = vi.fn().mockRejectedValue(new Error('network down'));
    const { rerender, result } = renderHook(({ value }) => useAutosave(value, save), { initialProps: { value: { a: 1 } } });
    rerender({ value: { a: 2 } });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('network down');
  });

  it('does nothing while disabled', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ value, enabled }) => useAutosave(value, save, enabled), {
      initialProps: { value: { a: 1 }, enabled: false },
    });
    rerender({ value: { a: 2 }, enabled: false });
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(save).not.toHaveBeenCalled();
  });
});
