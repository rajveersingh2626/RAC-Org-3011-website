import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('says what will appear and offers one way out', () => {
    render(
      <EmptyState
        title="No projects from this club yet"
        body="This club's first report will land here."
        action={<button type="button">Browse all 34 projects</button>}
      />,
    );
    expect(screen.getByText('No projects from this club yet')).toBeInTheDocument();
    expect(screen.getByText("This club's first report will land here.")).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
  it('is a dashed 16px card', () => {
    const { container } = render(<EmptyState title="Nothing here" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toMatch(/border-dashed/);
    expect(card.className).toMatch(/border-line/);
    expect(card.className).toMatch(/rounded-\[16px\]/);
    expect(card.className).toMatch(/text-center/);
  });
  it('renders without body or action', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('renders a decorative icon', () => {
    const { container } = render(<EmptyState title="x" icon={<svg data-testid="i" />} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <EmptyState title="Nothing here" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] > div')).toBeInTheDocument();
  });
});
