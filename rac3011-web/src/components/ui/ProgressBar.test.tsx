import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('exposes progressbar aria values', () => {
    render(<ProgressBar value={1847} max={3011} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1847');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '3011');
  });
  it('drives the fill width from the --pct variable', () => {
    const { container } = render(<ProgressBar value={50} max={200} />);
    const fill = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(fill.style.getPropertyValue('--pct')).toBe('25%');
    expect(fill.className).toMatch(/w-\[var\(--pct\)\]/);
    expect(fill.className).toMatch(/bg-accent/);
  });
  it('clamps the bar at 100% while the figure is not capped', () => {
    render(<ProgressBar value={3400} max={3011} hint="3,400 of 3,011" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('data-pct', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '3400');
    expect(screen.getByText('3,400 of 3,011')).toBeInTheDocument();
  });
  it('renders label and hint, and uses the track colour for the rail', () => {
    render(<ProgressBar value={1} max={2} label="Mission 3011" hint="halfway" />);
    expect(screen.getByText('Mission 3011')).toBeInTheDocument();
    expect(screen.getByRole('progressbar').className).toMatch(/bg-track/);
  });
  it('supports a small size', () => {
    render(<ProgressBar value={1} max={2} size="sm" />);
    expect(screen.getByRole('progressbar').className).toMatch(/h-1\.5/);
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <ProgressBar value={1} max={2} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role="progressbar"]')).toBeInTheDocument();
  });
});
