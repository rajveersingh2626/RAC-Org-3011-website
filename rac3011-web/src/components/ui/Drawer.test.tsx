import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from './Drawer';

function Harness({ side }: { side?: 'left' | 'right' | 'bottom' }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Filters" side={side} footer={<button type="button">Apply</button>}>
        <button type="button">inside</button>
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(<Drawer open={false} onClose={() => {}} title="Filters" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a labelled dialog when open, defaulting to the right side', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-side', 'right');
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('respects the side prop', () => {
    render(<Harness side="bottom" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'bottom');
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

  it('closes on backdrop click but not on panel click', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'inside' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('drawer-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
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
