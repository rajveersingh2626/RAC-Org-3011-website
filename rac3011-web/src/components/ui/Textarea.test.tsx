import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders and accepts typing', async () => {
    render(<Textarea aria-label="Notes" />);
    const el = screen.getByRole('textbox', { name: 'Notes' });
    await userEvent.type(el, 'Hello');
    expect(el).toHaveValue('Hello');
  });
  it('shows a counter when maxLength is set', async () => {
    render(<Textarea aria-label="Notes" maxLength={400} defaultValue="abc" />);
    expect(screen.getByText('3 / 400')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), 'd');
    expect(screen.getByText('4 / 400')).toBeInTheDocument();
  });
  it('is fixed height with no resize and min 44px', () => {
    render(<Textarea aria-label="x" />);
    const c = screen.getByRole('textbox').className;
    expect(c).toMatch(/resize-none/);
    expect(c).toMatch(/min-h-11/);
  });
  it('marks error and disabled', () => {
    render(<Textarea aria-label="x" aria-invalid disabled />);
    const el = screen.getByRole('textbox');
    expect(el).toHaveAttribute('data-invalid', 'true');
    expect(el).toBeDisabled();
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Textarea aria-label="x" maxLength={10} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] textarea')).toBeInTheDocument();
  });
});
