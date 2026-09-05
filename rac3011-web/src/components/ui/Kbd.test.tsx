import { render, screen } from '@testing-library/react';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('renders a kbd element with hairline and page background', () => {
    render(<Kbd>S</Kbd>);
    const el = screen.getByText('S');
    expect(el.tagName).toBe('KBD');
    expect(el.className).toMatch(/border-line/);
    expect(el.className).toMatch(/bg-page/);
    expect(el.className).toMatch(/rounded-\[5px\]/);
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Kbd>⌘K</Kbd>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] kbd')).toHaveTextContent('⌘K');
  });
});
