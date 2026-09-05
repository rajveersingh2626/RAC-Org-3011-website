import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders with aria-label from label and fires click', async () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Close" onClick={onClick}>
        <X />
      </IconButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it.each(['ghost', 'soft', 'primary'] as const)('renders %s variant with 44px square', (variant) => {
    render(
      <IconButton label="x" variant={variant}>
        <X />
      </IconButton>,
    );
    const b = screen.getByRole('button');
    expect(b).toHaveAttribute('data-variant', variant);
    expect(b.className).toMatch(/min-h-11/);
    expect(b.className).toMatch(/min-w-11/);
  });
  it('can be disabled', () => {
    render(
      <IconButton label="x" disabled>
        <X />
      </IconButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <IconButton label="Dark">
          <X />
        </IconButton>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] button svg')).toBeInTheDocument();
  });
});
