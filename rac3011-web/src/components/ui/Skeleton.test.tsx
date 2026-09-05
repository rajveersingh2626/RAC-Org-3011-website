import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders an aria-hidden pulsing block', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild;
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el?.className).toMatch(/animate-pulse/);
  });
  it.each(['text', 'circle', 'rect'] as const)('renders %s shape', (shape) => {
    const { container } = render(<Skeleton shape={shape} />);
    expect(container.firstElementChild).toHaveAttribute('data-shape', shape);
  });
  it('renders multiple text lines', () => {
    const { container } = render(<Skeleton shape="text" lines={3} />);
    expect(container.querySelectorAll('[data-shape="text"]')).toHaveLength(3);
  });
  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <Skeleton />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [aria-hidden]')).toBeInTheDocument();
  });
});
