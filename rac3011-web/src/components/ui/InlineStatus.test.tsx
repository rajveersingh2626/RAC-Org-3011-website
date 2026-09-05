import { render, screen } from '@testing-library/react';
import { InlineStatus, type InlineStatusState } from './InlineStatus';

const cases: [InlineStatusState, string][] = [
  ['checking', 'Checking link…'],
  ['ok', 'Link works'],
  ['broken', 'Link is broken'],
  ['private', 'Private — sign in to open'],
];

describe('InlineStatus', () => {
  it.each(cases)('renders the default label and data-state for %s', (state, label) => {
    const { container } = render(<InlineStatus state={state} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector(`[data-state="${state}"]`)).toBeInTheDocument();
  });
  it('accepts a custom label', () => {
    render(<InlineStatus state="broken" label="Drive link 404s" />);
    expect(screen.getByText('Drive link 404s')).toBeInTheDocument();
  });
  it('hides the icon from assistive tech and pulses only while checking', () => {
    const { container: checking } = render(<InlineStatus state="checking" />);
    const icon = checking.querySelector('svg') as SVGElement;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.getAttribute('class')).toMatch(/animate-pulse/);
    const { container: ok } = render(<InlineStatus state="ok" />);
    expect((ok.querySelector('svg') as SVGElement).getAttribute('class')).not.toMatch(/animate-pulse/);
  });
  it('tones broken as danger', () => {
    const { container } = render(<InlineStatus state="broken" />);
    expect((container.firstElementChild as HTMLElement).className).toMatch(/text-danger/);
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <InlineStatus state="ok" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [data-state="ok"]')).toBeInTheDocument();
  });
});
