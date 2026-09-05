import { render, screen } from '@testing-library/react';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders an unlabelled separator with a fading hairline', () => {
    render(<Divider />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    expect(sep.className).toMatch(/h-px/);
    expect(sep.className).toMatch(/bg-gradient-to-r/);
  });
  it('supports vertical orientation', () => {
    render(<Divider orientation="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    expect(sep.className).toMatch(/w-px/);
  });
  it('renders the label as real text with decorative rules hidden', () => {
    const { container } = render(<Divider label="Section label" />);
    const label = screen.getByText('Section label');
    expect(label.className).toMatch(/text-accent/);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
  it('renders a labelled vertical rule', () => {
    render(<Divider label="OR" orientation="vertical" />);
    expect(screen.getByText('OR')).toBeInTheDocument();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Divider label="OR" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"]')).toHaveTextContent('OR');
  });
});
