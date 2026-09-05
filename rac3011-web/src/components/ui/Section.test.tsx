import { render, screen } from '@testing-library/react';
import { Section } from './Section';

describe('Section', () => {
  it('renders eyebrow, title as h2 by default, description and action', () => {
    render(
      <Section eyebrow="Scoring" title="Monthly reports" description="What the secretariat sees." action={<button type="button">New</button>}>
        <p>content</p>
      </Section>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Monthly reports' })).toBeInTheDocument();
    expect(screen.getByText('Scoring').className).toMatch(/text-accent/);
    expect(screen.getByText('What the secretariat sees.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
  it('honours headingLevel', () => {
    render(<Section title="Sub" headingLevel={4} />);
    expect(screen.getByRole('heading', { level: 4, name: 'Sub' })).toBeInTheDocument();
  });
  it('omits the header block when no header props are given', () => {
    render(<Section><span>bare</span></Section>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('bare')).toBeInTheDocument();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Section title="Dark" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] h2')).toHaveTextContent('Dark');
  });
});
