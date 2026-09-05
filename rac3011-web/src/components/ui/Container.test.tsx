import { render, screen } from '@testing-library/react';
import { Container } from './Container';

describe('Container', () => {
  it('centres with responsive gutters and default max width', () => {
    const { container } = render(<Container>body</Container>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toMatch(/mx-auto/);
    expect(el.className).toMatch(/px-5/);
    expect(el.className).toMatch(/md:px-8/);
    expect(el.className).toMatch(/max-w-\[1200px\]/);
  });
  it('supports narrow and wide widths and the as prop', () => {
    render(<Container as="main" width="narrow">n</Container>);
    expect(screen.getByRole('main').className).toMatch(/max-w-\[760px\]/);
    const { container } = render(<Container width="wide">w</Container>);
    expect((container.firstElementChild as HTMLElement).className).toMatch(/max-w-\[1440px\]/);
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Container>dark body</Container>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] [data-width="default"]')).toHaveTextContent('dark body');
  });
});
