import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlagshipCarousel } from './FlagshipCarousel';

const ITEMS = [
  { title: 'Mahadan 9.0', summary: 'Blood donation drive.' },
  { title: 'Clean Yamuna', summary: 'River clean-ups.' },
];

describe('FlagshipCarousel', () => {
  it('renders nothing when there are no items', () => {
    const { container } = render(<FlagshipCarousel items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('expands the first item by default', () => {
    render(<FlagshipCarousel items={ITEMS} />);
    expect(screen.getByRole('button', { name: /Mahadan 9.0/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Clean Yamuna/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands the hovered item and collapses the others', async () => {
    render(<FlagshipCarousel items={ITEMS} />);
    await userEvent.hover(screen.getByRole('button', { name: /Clean Yamuna/ }));
    expect(screen.getByRole('button', { name: /Clean Yamuna/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Mahadan 9.0/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands on focus for keyboard users', async () => {
    render(<FlagshipCarousel items={ITEMS} />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /Clean Yamuna/ })).toHaveAttribute('aria-expanded', 'true');
  });
});
