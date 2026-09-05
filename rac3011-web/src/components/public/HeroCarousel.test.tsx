import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroCarousel, type HeroSlide } from './HeroCarousel';

const SLIDE_A: HeroSlide = { badge: 'District 3011', title: 'Slide A', subtitle: 'Sub A', ctaPrimary: 'Go A', ctaSecondary: null };
const SLIDE_B: HeroSlide = { badge: null, title: 'Slide B', subtitle: null, ctaPrimary: null, ctaSecondary: null };

describe('HeroCarousel', () => {
  it('renders the single slide with no dots when there is only one', () => {
    render(<HeroCarousel slides={[SLIDE_A]} />);
    expect(screen.getByText('Slide A')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('shows dot navigation for multiple slides and switches on click', async () => {
    render(<HeroCarousel slides={[SLIDE_A, SLIDE_B]} />);
    expect(screen.getByText('Slide A')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByText('Slide B')).toBeInTheDocument();
  });

  it('falls back to the district name when a slide has no title', () => {
    render(<HeroCarousel slides={[{ badge: null, title: null, subtitle: null, ctaPrimary: null, ctaSecondary: null }]} />);
    expect(screen.getByText('Rotaract District 3011')).toBeInTheDocument();
  });

  it('invokes the primary and secondary CTA callbacks', async () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    render(<HeroCarousel slides={[{ ...SLIDE_A, ctaSecondary: 'Go B' }]} onPrimaryClick={onPrimary} onSecondaryClick={onSecondary} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Go B' }));
    expect(onPrimary).toHaveBeenCalledOnce();
    expect(onSecondary).toHaveBeenCalledOnce();
  });
});
