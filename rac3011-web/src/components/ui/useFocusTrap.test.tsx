import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getFocusable, useFocusTrap, useScrollLock } from './useFocusTrap';

function Trapped({ active, empty = false }: { active: boolean; empty?: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active);
  useScrollLock(active);
  if (!active) return null;
  return (
    <div ref={ref} data-testid="trap">
      {empty ? (
        <p>nothing focusable</p>
      ) : (
        <>
          <button type="button">one</button>
          <button type="button" disabled>
            skipped
          </button>
          <button type="button" tabIndex={-1}>
            programmatic
          </button>
          <button type="button">two</button>
        </>
      )}
    </div>
  );
}

function Toggle() {
  const [active, setActive] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setActive(true)}>
        open
      </button>
      <Trapped active={active} />
      {active ? (
        <button type="button" onClick={() => setActive(false)}>
          shutit
        </button>
      ) : null}
    </>
  );
}

describe('useFocusTrap', () => {
  it('filters out disabled, hidden and tabindex=-1 nodes', () => {
    render(<Trapped active />);
    const names = getFocusable(screen.getByTestId('trap')).map((el) => el.textContent);
    expect(names).toEqual(['one', 'two']);
  });

  it('focuses the first focusable on activation', () => {
    render(<Trapped active />);
    expect(screen.getByRole('button', { name: 'one' })).toHaveFocus();
  });

  it('focuses the container itself when nothing is focusable', () => {
    render(<Trapped active empty />);
    expect(screen.getByTestId('trap')).toHaveFocus();
  });

  it('wraps Tab forward and Shift+Tab backward', async () => {
    const user = userEvent.setup();
    render(<Trapped active />);
    const first = screen.getByRole('button', { name: 'one' });
    const last = screen.getByRole('button', { name: 'two' });
    expect(first).toHaveFocus();
    await user.tab();
    expect(last).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('restores focus to the previously focused element on deactivation', async () => {
    const user = userEvent.setup();
    render(<Toggle />);
    const opener = screen.getByRole('button', { name: 'open' });
    await user.click(opener);
    expect(screen.getByRole('button', { name: 'one' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'shutit' }));
    expect(opener).toHaveFocus();
  });

  it('locks and restores body overflow', async () => {
    const user = userEvent.setup();
    render(<Toggle />);
    expect(document.body.style.overflow).toBe('');
    await user.click(screen.getByRole('button', { name: 'open' }));
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(screen.getByRole('button', { name: 'shutit' }));
    expect(document.body.style.overflow).toBe('');
  });

  it('renders inside a dark theme container', () => {
    render(
      <div data-theme="dark">
        <Trapped active />
      </div>,
    );
    expect(screen.getByTestId('trap')).toBeInTheDocument();
  });
});
