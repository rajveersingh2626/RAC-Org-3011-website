import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit August</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Submit August' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it.each(['primary', 'secondary', 'ghost', 'danger', 'link', 'soft'] as const)('renders %s variant', (variant) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
  });
  it('keeps a 44px minimum height class', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button').className).toMatch(/min-h-11/);
  });
  it('is disabled and busy while loading', () => {
    render(<Button loading>Sending…</Button>);
    const b = screen.getByRole('button');
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute('aria-busy', 'true');
  });
  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <Button>Dark</Button>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] button')).toBeInTheDocument();
  });
});
