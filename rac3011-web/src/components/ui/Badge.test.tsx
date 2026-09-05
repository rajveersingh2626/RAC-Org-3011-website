import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>Submitted</Badge>);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });
  it.each(['neutral', 'pink', 'green', 'amber', 'red', 'blue'] as const)('renders %s tone', (tone) => {
    render(<Badge tone={tone}>T</Badge>);
    expect(screen.getByText('T')).toHaveAttribute('data-tone', tone);
  });
  it('green tone carries a dark-theme variant class', () => {
    render(<Badge tone="green">T</Badge>);
    expect(screen.getByText('T').className).toMatch(/\[\[data-theme=dark\]_&\]/);
  });
  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <Badge>Dark</Badge>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [data-tone]')).toBeInTheDocument();
  });
});
