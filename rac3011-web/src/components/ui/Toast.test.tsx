import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './Toast';

function Trigger() {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast({ title: 'Report submitted', body: 'September, so far', duration: 40 })}>
      fire
    </button>
  );
}

describe('Toast', () => {
  it('throws when used outside a ToastProvider', () => {
    function Bare() {
      useToast();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useToast must be used inside ToastProvider');
  });

  it('shows a toast with a title and body in a live region', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('Report submitted')).toBeInTheDocument();
    expect(screen.getByText('September, so far')).toBeInTheDocument();
  });

  it('auto-dismisses after its duration', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByText('Report submitted')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Report submitted')).not.toBeInTheDocument());
  });

  it('dismisses on demand via the close button', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'fire' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Report submitted')).not.toBeInTheDocument();
  });

  it('stacks multiple toasts', async () => {
    function MultiTrigger() {
      const { toast } = useToast();
      return (
        <button type="button" onClick={() => { toast({ title: 'First', duration: 10000 }); toast({ title: 'Second', duration: 10000 }); }}>
          fire
        </button>
      );
    }
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('defaults to the success tone', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByText('Report submitted').closest('li')).toHaveAttribute('data-tone', 'success');
  });

  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <ToastProvider>
          <Trigger />
        </ToastProvider>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] button')).toBeInTheDocument();
  });
});
