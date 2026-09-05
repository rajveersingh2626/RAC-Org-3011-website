import { render, screen, fireEvent } from '@testing-library/react';
import { LowResPortrait } from './LowResPortrait';

describe('LowResPortrait', () => {
  it('shows the empty state when there is no source', () => {
    render(<LowResPortrait src={null} alt="Past DRR" />);
    expect(screen.getByText('No photo on file')).toBeInTheDocument();
  });

  it('renders the image capped at its natural size, never upscaled', () => {
    render(<LowResPortrait src="https://example.com/photo.jpg" alt="Past DRR" />);
    const img = screen.getByRole('img', { name: 'Past DRR' });
    expect(img.className).toContain('max-h-[152px]');
    expect(img.className).toContain('max-w-[152px]');
  });

  it('falls back to an error state when the image fails to load', () => {
    render(<LowResPortrait src="https://example.com/broken.jpg" alt="Past DRR" />);
    fireEvent.error(screen.getByRole('img', { name: 'Past DRR' }));
    expect(screen.getByText('Photo unavailable')).toBeInTheDocument();
  });
});
