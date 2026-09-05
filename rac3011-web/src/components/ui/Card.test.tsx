import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders eyebrow, title, children and footer', () => {
    render(
      <Card eyebrow="This month" title="August report" footer={<span>Footer</span>}>
        Body
      </Card>,
    );
    expect(screen.getByText('This month')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'August report' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
  it.each(['plain', 'action', 'dashed'] as const)('renders %s tone', (tone) => {
    const { container } = render(<Card tone={tone}>x</Card>);
    expect(container.firstElementChild).toHaveAttribute('data-tone', tone);
  });
  it('action tone has accent border and no shadow', () => {
    const { container } = render(<Card tone="action">x</Card>);
    const cls = container.firstElementChild?.className ?? '';
    expect(cls).toMatch(/border-accent/);
    expect(cls).not.toMatch(/shadow-raised/);
  });
  it('renders as a section', () => {
    const { container } = render(<Card as="section">x</Card>);
    expect(container.firstElementChild?.tagName).toBe('SECTION');
  });
  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <Card>Dark</Card>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [data-tone]')).toBeInTheDocument();
  });
});
