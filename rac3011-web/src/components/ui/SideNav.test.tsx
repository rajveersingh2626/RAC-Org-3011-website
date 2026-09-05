import { render, screen } from '@testing-library/react';
import { SideNav } from './SideNav';

const groups = [
  {
    label: 'Overview',
    items: [
      { key: 'dash', label: 'Dashboard', href: '/portal' },
      { key: 'ann', label: 'Announcements', href: '/portal/announcements' },
    ],
  },
  {
    label: 'Admin',
    items: [{ key: 'users', label: 'Users & roles', href: '/portal/admin/users', icon: <svg data-testid="icon" /> }],
  },
];

describe('SideNav', () => {
  it('renders a labelled nav with grouped links', () => {
    render(<SideNav groups={groups} activeHref="/portal" label="Primary" />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('marks only the active href as current', () => {
    render(<SideNav groups={groups} activeHref="/portal/announcements" label="Primary" />);
    expect(screen.getByRole('link', { name: 'Announcements' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('renders an item icon when provided', () => {
    render(<SideNav groups={groups} activeHref="/portal" label="Primary" />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('omits a group entirely when its items array is empty (caller-side hiding)', () => {
    render(
      <SideNav
        groups={[...groups, { label: 'Reporting', items: [] }]}
        activeHref="/portal"
        label="Primary"
      />,
    );
    expect(screen.queryByText('Reporting')).not.toBeInTheDocument();
  });

  it('renders every link as a real <a href> with a 44px hit target', () => {
    render(<SideNav groups={groups} activeHref="/portal" label="Primary" />);
    for (const link of screen.getAllByRole('link')) {
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href');
      expect(link.className).toMatch(/min-h-11/);
    }
  });

  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <SideNav groups={groups} activeHref="/portal" label="Primary" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] nav')).toBeInTheDocument();
  });
});
