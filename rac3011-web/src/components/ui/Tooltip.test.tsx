import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('is hidden until the trigger is focused or hovered', () => {
    render(
      <Tooltip content="Point-system methodology">
        <button type="button">Score</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on focus and links it via aria-describedby', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Point-system methodology">
        <button type="button">Score</button>
      </Tooltip>,
    );
    await user.tab();
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Point-system methodology');
    expect(screen.getByRole('button', { name: 'Score' })).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('closes on blur', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Tooltip content="Point-system methodology">
          <button type="button">Score</button>
        </Tooltip>
        <button type="button">Next</button>
      </div>,
    );
    await user.tab();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on mouse enter and closes on mouse leave', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Point-system methodology">
        <button type="button">Score</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Score' });
    await user.hover(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Point-system methodology">
        <button type="button">Score</button>
      </Tooltip>,
    );
    await user.tab();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders in dark theme', async () => {
    const user = userEvent.setup();
    render(
      <div data-theme="dark">
        <Tooltip content="Dark tip">
          <button type="button">Score</button>
        </Tooltip>
      </div>,
    );
    await user.tab();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
