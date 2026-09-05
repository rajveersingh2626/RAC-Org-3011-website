import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders img with alt when src given', () => {
    render(<Avatar name="Rahul Bansal" src="/x.png" />);
    expect(screen.getByRole('img', { name: 'Rahul Bansal' }).tagName).toBe('IMG');
  });
  it('renders initials without src', () => {
    render(<Avatar name="Rahul Bansal" />);
    const el = screen.getByRole('img', { name: 'Rahul Bansal' });
    expect(el.tagName).not.toBe('IMG');
    expect(el).toHaveTextContent('RB');
  });
  it('falls back to initials on img error', () => {
    render(<Avatar name="Tanya Sharma" src="/broken.png" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img', { name: 'Tanya Sharma' })).toHaveTextContent('TS');
  });
  it.each(['sm', 'md', 'lg', 'xl'] as const)('renders %s size', (size) => {
    render(<Avatar name="A" size={size} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-size', size);
  });
  it('uses one letter for a single-word name', () => {
    render(<Avatar name="Prashant" />);
    expect(screen.getByRole('img')).toHaveTextContent('P');
  });
  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <Avatar name="Dark Mode" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [role="img"]')).toHaveTextContent('DM');
  });
});
