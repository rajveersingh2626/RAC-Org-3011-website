import { render, screen } from '@testing-library/react';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('keeps content in the accessible tree with sr-only', () => {
    render(<VisuallyHidden>completed</VisuallyHidden>);
    const el = screen.getByText('completed');
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/sr-only/);
  });
  it('honours the as prop', () => {
    render(<VisuallyHidden as="h2">Section</VisuallyHidden>);
    expect(screen.getByRole('heading', { level: 2, name: 'Section' })).toBeInTheDocument();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <VisuallyHidden>current</VisuallyHidden>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] .sr-only')).toHaveTextContent('current');
  });
});
