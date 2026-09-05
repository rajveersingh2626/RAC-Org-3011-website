import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('announces itself with default copy', () => {
    render(<ErrorState />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
  });
  it('fires onRetry from the retry button', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button.className).toMatch(/min-h-11/);
    await userEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it('uses a custom retry label', () => {
    render(<ErrorState onRetry={() => {}} retryLabel="Reload count" />);
    expect(screen.getByRole('button', { name: 'Reload count' })).toBeInTheDocument();
  });
  it('renders no button when there is nothing to retry', () => {
    render(<ErrorState title="Live count unavailable" body="Last recorded: 38 of 100." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Live count unavailable')).toBeInTheDocument();
    expect(screen.getByText('Last recorded: 38 of 100.')).toBeInTheDocument();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <ErrorState onRetry={() => {}} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role="alert"]')).toBeInTheDocument();
  });
});
