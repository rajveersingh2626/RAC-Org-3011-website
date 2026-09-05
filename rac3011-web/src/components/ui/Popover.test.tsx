import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover } from './Popover';

describe('Popover', () => {
  it('is closed by default and opens on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Popover label="Filters">
        <button type="button">Clear all</button>
      </Popover>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('focuses the first focusable element inside on open', async () => {
    const user = userEvent.setup();
    render(
      <Popover label="Filters">
        <button type="button">Clear all</button>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('button', { name: 'Clear all' })).toHaveFocus();
  });

  it('toggles closed on a second trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Popover label="Filters">
        <p>Content</p>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(
      <Popover label="Filters">
        <button type="button">Clear all</button>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover label="Filters">
          <p>Content</p>
        </Popover>
        <button type="button">outside</button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('respects the align prop', async () => {
    const user = userEvent.setup();
    render(
      <Popover label="Filters" align="end">
        <p>Content</p>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-align', 'end');
  });

  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Popover label="Filters">
          <p>Content</p>
        </Popover>
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] button')).toBeInTheDocument();
  });
});
