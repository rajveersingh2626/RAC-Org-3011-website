import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/app/theme';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renders an accessible toggle reflecting the light theme', () => {
    render(
      <ThemeProvider profilePreference="light">
        <ThemeToggle />
      </ThemeProvider>,
    );
    const button = screen.getByRole('button', { name: 'Toggle dark mode' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('reflects the dark theme', () => {
    render(
      <ThemeProvider profilePreference="dark">
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls toggle() on click, flipping the document theme attribute', async () => {
    render(
      <ThemeProvider profilePreference="light">
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    await userEvent.click(screen.getByRole('button', { name: 'Toggle dark mode' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('has a 44px hit target', () => {
    render(
      <ThemeProvider profilePreference="light">
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Toggle dark mode' }).className).toMatch(/min-h-11/);
  });
});
