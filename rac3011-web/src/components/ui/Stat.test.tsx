import { render, screen } from '@testing-library/react';
import { Stat } from './Stat';

describe('Stat', () => {
  it('renders label, value and hint', () => {
    render(<Stat label="Units" value="1,204" hint="of 3,011" />);
    expect(screen.getByText('Units')).toBeInTheDocument();
    expect(screen.getByText('1,204').className).toMatch(/text-\[30px\]/);
    expect(screen.getByText('of 3,011')).toBeInTheDocument();
  });
  it.each(['up', 'down', 'neutral'] as const)('renders %s delta tone', (tone) => {
    render(<Stat label="L" value="1" delta={{ text: '+4', tone }} />);
    expect(screen.getByText('+4')).toHaveAttribute('data-tone', tone);
  });
  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <Stat label="L" value="9" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"]')).toHaveTextContent('9');
  });
});
