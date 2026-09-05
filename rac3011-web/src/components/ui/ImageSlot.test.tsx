import { fireEvent, render, screen } from '@testing-library/react';
import { ImageSlot } from './ImageSlot';

describe('ImageSlot', () => {
  it('renders the image when a src is given', () => {
    render(<ImageSlot src="https://example.com/a.jpg" alt="Blood camp" />);
    const img = screen.getByRole('img', { name: 'Blood camp' });
    expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img.className).toMatch(/object-cover/);
  });
  it('falls back to a designed panel when the image fails', () => {
    render(<ImageSlot src="https://drive.example/broken" alt="Broken" />);
    fireEvent.error(screen.getByRole('img', { name: 'Broken' }));
    expect(screen.getByText('Photo unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Broken' })).not.toBeInTheDocument();
  });
  it('renders the prompt when there is no src', () => {
    const { container } = render(<ImageSlot alt="Day photo" prompt="Drop a photo from the day" />);
    expect(screen.getByText('Drop a photo from the day')).toBeInTheDocument();
    expect(container.querySelector('[data-state="empty"]')?.className).toMatch(/border-dashed/);
  });
  it('applies each fixed aspect ratio', () => {
    const { container: c1 } = render(<ImageSlot alt="a" ratio="4:3" />);
    expect(c1.querySelector('[data-state="empty"]')?.className).toMatch(/aspect-\[4\/3\]/);
    const { container: c2 } = render(<ImageSlot alt="b" ratio="1:1" />);
    expect(c2.querySelector('[data-state="empty"]')?.className).toMatch(/aspect-square/);
    const { container: c3 } = render(<ImageSlot alt="c" ratio="3:4" />);
    expect(c3.querySelector('[data-state="empty"]')?.className).toMatch(/aspect-\[3\/4\]/);
  });
  it('renders a caption', () => {
    render(<ImageSlot src="https://example.com/a.jpg" alt="a" caption="640 x 480" />);
    expect(screen.getByText('640 x 480').tagName).toBe('FIGCAPTION');
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <ImageSlot src="https://example.com/a.jpg" alt="a" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] img')).toBeInTheDocument();
  });
});
