import { render, screen } from '@testing-library/react';
import { Stepper } from './Stepper';

const steps = [
  { id: 'creds', label: 'Sign in' },
  { id: 'otp', label: 'Verify' },
];

describe('Stepper', () => {
  it('renders an ordered list with one item per step', () => {
    render(<Stepper steps={steps} currentId="otp" label="Login progress" />);
    const list = screen.getByRole('list', { name: 'Login progress' });
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('marks the current step for assistive tech and shows a Step X of N caption', () => {
    render(<Stepper steps={steps} currentId="otp" label="Login progress" />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).not.toHaveAttribute('aria-current');
    expect(rows[1]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  });

  it('marks earlier steps done and later steps upcoming via data-state', () => {
    render(<Stepper steps={[...steps, { id: 'done', label: 'Finish' }]} currentId="otp" label="Progress" />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveAttribute('data-state', 'done');
    expect(rows[1]).toHaveAttribute('data-state', 'current');
    expect(rows[2]).toHaveAttribute('data-state', 'todo');
  });

  it('conveys state in text, not colour alone', () => {
    render(<Stepper steps={[...steps, { id: 'done', label: 'Finish' }]} currentId="otp" label="Progress" />);
    expect(screen.getByText(/^Done/)).toBeInTheDocument();
    expect(screen.getByText(/^Current step/)).toBeInTheDocument();
    expect(screen.getByText(/^Not started/)).toBeInTheDocument();
  });

  it('shows a numeral for upcoming/current steps and a check mark for done steps', () => {
    const { container } = render(
      <Stepper steps={[...steps, { id: 'done', label: 'Finish' }]} currentId="otp" label="Progress" />,
    );
    const rows = Array.from(container.querySelectorAll('li'));
    expect(rows[0].querySelector('svg')).toBeInTheDocument();
    expect(rows[1].textContent).toContain('2');
    expect(rows[2].textContent).toContain('3');
  });

  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Stepper steps={steps} currentId="creds" label="Progress" />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] ol')).toBeInTheDocument();
  });
});
