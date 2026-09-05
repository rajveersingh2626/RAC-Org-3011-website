import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs';

const items = [
  { label: 'Resources', href: '/resources' },
  { label: 'Documents', href: '/resources/documents' },
  { label: 'Point-system methodology' },
];

describe('Breadcrumbs', () => {
  it('renders a labelled nav with an ordered list of links', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute('href', '/resources');
  });
  it('marks the last item as current with no link', () => {
    render(<Breadcrumbs items={items} />);
    const last = screen.getByText('Point-system methodology');
    expect(last).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Point-system methodology' })).not.toBeInTheDocument();
  });
  it('hides the separators from assistive tech', () => {
    const { container } = render(<Breadcrumbs items={items} />);
    const seps = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(seps).toHaveLength(2);
    expect(seps.every((s) => s.textContent === '/')).toBe(true);
  });
  it('never marks the last item as current when it has an href but still drops the link', () => {
    render(<Breadcrumbs items={[{ label: 'A', href: '/a' }, { label: 'B', href: '/b' }]} />);
    expect(screen.queryByRole('link', { name: 'B' })).not.toBeInTheDocument();
    expect(screen.getByText('B')).toHaveAttribute('aria-current', 'page');
  });
  it('accepts a custom link component and renders nothing when empty', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container).toBeEmptyDOMElement();
    function Custom({ href, children }: { href?: string; children?: ReactNode }) {
      return <a data-custom href={href}>{children}</a>;
    }
    render(<Breadcrumbs items={items} linkComponent={Custom} />);
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute('data-custom');
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Breadcrumbs items={items} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] nav[aria-label=Breadcrumb]')).toBeInTheDocument();
  });
});
