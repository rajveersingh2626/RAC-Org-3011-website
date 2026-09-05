import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('defaults to the info tone with role=status', () => {
    render(<Alert title="Heads up">Some detail</Alert>);
    const alert = screen.getByRole('status');
    expect(alert).toHaveAttribute('data-tone', 'info');
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Some detail')).toBeInTheDocument();
  });

  it('uses role=alert for the warning tone', () => {
    render(<Alert tone="warning" title="Careful" />);
    expect(screen.getByRole('alert')).toHaveAttribute('data-tone', 'warning');
  });

  it('uses role=alert for the error tone and a danger-coloured title', () => {
    render(<Alert tone="error" title="Failed" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-tone', 'error');
    expect(screen.getByText('Failed').className).toMatch(/text-danger/);
  });

  it('uses role=status for the action tone', () => {
    render(<Alert tone="action" title="Renew now" />);
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'action');
  });

  it('renders an optional action', () => {
    render(
      <Alert title="Renew" action={<button type="button">Renew</button>}>
        Body
      </Alert>,
    );
    expect(screen.getByRole('button', { name: 'Renew' })).toBeInTheDocument();
  });

  it('omits the body paragraph when no children are given', () => {
    render(<Alert title="Just a title" />);
    expect(screen.getByText('Just a title')).toBeInTheDocument();
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });

  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Alert title="Dark" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role=status]')).toBeInTheDocument();
  });
});
