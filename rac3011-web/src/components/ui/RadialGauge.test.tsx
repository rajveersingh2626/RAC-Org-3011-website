import { render, screen } from '@testing-library/react';
import { RadialGauge } from './RadialGauge';

function ring(container: HTMLElement): HTMLElement {
  return container.querySelector('[role="img"]') as HTMLElement;
}

describe('RadialGauge', () => {
  it('holds the ring at zero with no spinner', () => {
    const { container } = render(<RadialGauge value={0} max={3011} />);
    const el = ring(container);
    expect(el).toHaveAttribute('data-pct', '0');
    expect(el.style.getPropertyValue('--pct')).toBe('0%');
    expect(container.querySelector('.animate-spin')).toBeNull();
  });
  it('fills proportionally', () => {
    const { container } = render(<RadialGauge value={1847} max={3011} />);
    const pct = Number(ring(container).getAttribute('data-pct'));
    expect(Math.round(pct)).toBe(61);
    expect(ring(container).style.getPropertyValue('--pct')).toMatch(/^61\./);
  });
  it('clamps the ring at 100% but never caps the figure', () => {
    const { container } = render(<RadialGauge value={3400} max={3011} />);
    expect(ring(container)).toHaveAttribute('data-pct', '100');
    expect(ring(container).style.getPropertyValue('--pct')).toBe('100%');
    expect(screen.getByText('3,400')).toBeInTheDocument();
  });
  it('exposes an accessible label naming value of max', () => {
    render(<RadialGauge value={1847} max={3011} />);
    expect(screen.getByRole('img', { name: '1,847 of 3,011' })).toBeInTheDocument();
  });
  it('uses a conic gradient driven by the css variable', () => {
    const { container } = render(<RadialGauge value={10} max={100} />);
    expect(container.querySelector('[aria-hidden="true"]')?.className).toMatch(/conic-gradient/);
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <RadialGauge value={100} max={200} label="100" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role="img"]')).toBeInTheDocument();
  });
});
