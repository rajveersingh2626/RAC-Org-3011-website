import { render, screen } from '@testing-library/react';
import { Timeline } from './Timeline';

const items = [
  { title: 'Submitted', meta: '2 September', state: 'done' as const },
  { title: 'Approved', body: 'The secretariat is reviewing.', state: 'current' as const },
  { title: 'Counted', state: 'todo' as const },
];

describe('Timeline', () => {
  it('renders an ordered list with one item per step', () => {
    render(<Timeline items={items} />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('2 September')).toBeInTheDocument();
    expect(screen.getByText('The secretariat is reviewing.')).toBeInTheDocument();
  });
  it('marks the current step for assistive tech', () => {
    render(<Timeline items={items} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[1]).toHaveAttribute('aria-current', 'step');
    expect(rows[0]).not.toHaveAttribute('aria-current');
    expect(rows[2]).not.toHaveAttribute('aria-current');
  });
  it('conveys state in text, not colour alone', () => {
    render(<Timeline items={items} />);
    expect(screen.getByText(/^Done/)).toBeInTheDocument();
    expect(screen.getByText(/^Current step/)).toBeInTheDocument();
    expect(screen.getByText(/^Not started/)).toBeInTheDocument();
  });
  it('fills the dot per state', () => {
    const { container } = render(<Timeline items={items} />);
    const rows = Array.from(container.querySelectorAll('li'));
    expect(rows[0].getAttribute('data-state')).toBe('done');
    expect((rows[0].querySelector('span[aria-hidden="true"]') as HTMLElement).className).toMatch(/bg-accent/);
    expect((rows[1].querySelector('span[aria-hidden="true"]') as HTMLElement).className).toMatch(/ring-accent/);
    expect((rows[2].querySelector('span[aria-hidden="true"]') as HTMLElement).className).toMatch(/bg-track/);
  });
  it('defaults an item without state to todo', () => {
    const { container } = render(<Timeline items={[{ title: 'Later' }]} />);
    expect(container.querySelector('li')).toHaveAttribute('data-state', 'todo');
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Timeline items={items} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] ol')).toBeInTheDocument();
  });
});
