import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UiKitPage } from '../UiKitPage';

describe('UiKitPage', () => {
  it('renders every kit section in both theme panels without throwing', () => {
    render(<UiKitPage />);

    expect(screen.getByRole('heading', { name: 'UI kit' })).toBeInTheDocument();
    expect(screen.getAllByText(/theme$/i)).toHaveLength(2);

    expect(screen.getAllByRole('button', { name: 'Primary' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Open modal' })).toHaveLength(2);
    expect(screen.getAllByRole('table')).toHaveLength(2);
    expect(screen.getAllByRole('tablist', { name: 'Report sections' })).toHaveLength(2);
  });

  it('opens an independent modal instance from the light panel trigger', async () => {
    const user = userEvent.setup();
    render(<UiKitPage />);

    const [lightTrigger] = screen.getAllByRole('button', { name: 'Open modal' });
    await user.click(lightTrigger);

    expect(screen.getByRole('dialog', { name: 'Confirm submission' })).toBeInTheDocument();
  });
});
