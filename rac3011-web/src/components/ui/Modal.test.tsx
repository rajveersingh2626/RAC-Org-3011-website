import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

function Harness({ size, startOpen = true }: { size?: 'sm' | 'md' | 'lg'; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete report"
        description="This cannot be undone."
        size={size}
        footer={<button type="button">Confirm</button>}
      >
        <button type="button">inside</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={() => {}} title="x" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a labelled and described dialog, defaulting to md size', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-size', 'md');
    expect(dialog).toHaveAccessibleName('Delete report');
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
  });

  it('respects the size prop', () => {
    render(<Harness size="lg" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'lg');
  });

  it('omits aria-describedby when there is no description', () => {
    render(<Modal open onClose={() => {}} title="No description" />);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it('focuses the first focusable element on open', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('traps Tab focus inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const inside = screen.getByRole('button', { name: 'inside' });
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(inside).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(inside).toHaveFocus();
  });

  it('closes on backdrop click but not on panel click', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'inside' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('modal-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores focus to the opener on close', async () => {
    const user = userEvent.setup();
    render(<Harness startOpen={false} />);
    const opener = screen.getByRole('button', { name: 'open' });
    await user.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('renders under a dark theme root', () => {
    render(
      <div data-theme="dark">
        <Harness />
      </div>,
    );
    expect(document.querySelector('[data-theme="dark"]')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
