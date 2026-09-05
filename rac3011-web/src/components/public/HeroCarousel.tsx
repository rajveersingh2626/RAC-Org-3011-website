import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface HeroSlide {
  badge: string | null;
  title: string | null;
  subtitle: string | null;
  ctaPrimary: string | null;
  ctaSecondary: string | null;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export function HeroCarousel({ slides, onPrimaryClick, onSecondaryClick }: HeroCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const autoplay = slides.length > 1 && !paused && !reducedMotion;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [autoplay, slides.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'start' });
  }, [index, reducedMotion]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      className="relative"
    >
      <div
        ref={trackRef}
        data-testid="hero-track"
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {slides.map((s, i) => (
          <div key={i} className="w-full shrink-0 snap-start px-1">
            {i === index ? (
              <div className="flex flex-col items-start gap-4 py-10 text-left md:py-16">
                {s.badge ? (
                  <span className="rounded-[999px] bg-accent-soft px-3 py-1 text-[10.5px] font-bold uppercase tracking-[1px] text-accent-deep">
                    {s.badge}
                  </span>
                ) : null}
                <h1 className="m-0 max-w-[18ch] text-[34px] font-extrabold leading-[1.1] text-fg md:text-[46px] lg:text-[56px]">
                  {s.title ?? 'Rotaract District 3011'}
                </h1>
                {s.subtitle ? <p className="m-0 max-w-[54ch] text-[15px] text-fg-2 md:text-[17px]">{s.subtitle}</p> : null}
                <div className="flex flex-wrap gap-3">
                  {s.ctaPrimary ? (
                    <Button size="lg" onClick={onPrimaryClick}>
                      {s.ctaPrimary}
                    </Button>
                  ) : null}
                  {s.ctaSecondary ? (
                    <Button variant="secondary" size="lg" onClick={onSecondaryClick}>
                      {s.ctaSecondary}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <IconButton label="Previous slide" onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}>
            <ChevronLeft aria-hidden />
          </IconButton>
          <div role="tablist" aria-label="Hero slides" className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1} of ${slides.length}`}
                onClick={() => setIndex(i)}
                className={cn('size-2.5 rounded-full transition-colors', i === index ? 'bg-accent' : 'bg-track')}
              />
            ))}
          </div>
          <IconButton label="Next slide" onClick={() => setIndex((i) => (i + 1) % slides.length)}>
            <ChevronRight aria-hidden />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}
