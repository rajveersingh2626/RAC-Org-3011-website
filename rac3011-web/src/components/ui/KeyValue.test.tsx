import { render, screen } from '@testing-library/react';
import { KeyValue } from './KeyValue';

describe('KeyValue', () => {
  it('renders a dl with dt/dd pairs', () => {
    const { container } = render(<KeyValue items={[{ label: 'Zone', value: 'Zone 4' }, { label: 'Charter', value: '2014' }]} />);
    const dl = container.querySelector('dl');
    expect(dl).toBeInTheDocument();
    expect(dl?.className).toMatch(/sm:grid-cols-\[max-content_1fr\]/);
    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(screen.getByText('Zone 4').tagName).toBe('DD');
  });
  it('renders in dark theme container', () => {
    const { container } = render(
      <div data-theme="dark">
        <KeyValue items={[{ label: 'A', value: 'B' }]} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] dl')).toBeInTheDocument();
  });
});
