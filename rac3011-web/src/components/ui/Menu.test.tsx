import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu, type MenuItem } from './Menu';

function items(onSelect: (id: string) => void): MenuItem[] {
  return [
    { id: 'edit', label: 'Edit', onSelect: () => onSelect('edit') },
    { id: 'dup', label: 'Duplicate', onSelect: () => onSelect('dup'), disabled: true },
    { id: 'sep', type: 'separator' },
    { id: 'delete', label: 'Delete', onSelect: () => onSelect('delete'), destructive: true },
  ];
}

describe('Menu', () => {
  it('is closed by default and opens on click', async () => {
    const user = userEvent.setup();
    render(<Menu label="Actions" items={items(() => {})} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('orders destructive items last behind a separator', async () => {
    const user = userEvent.setup();
    render(<Menu label="Actions" items={items(() => {})} />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const menuItems = screen.getAllByRole('menuitem').map((el) => el.textContent);
    expect(menuItems).toEqual(['Edit', 'Duplicate', 'Delete']);
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-destructive', 'true');
  });

  it('opens with ArrowDown and moves focus to the first enabled item', async () => {
    const user = userEvent.setup();
    render(<Menu label="Actions" items={items(() => {})} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
  });

  it('skips disabled items when navigating with ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Menu label="Actions" items={items(() => {})} />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('selects the active item on click and calls onSelect, then closes and restores focus', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Menu label="Actions" items={items(onSelect)} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalledWith('edit');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('does not select a disabled item', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Menu label="Actions" items={items(onSelect)} />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const disabledItem = screen.getByRole('menuitem', { name: 'Duplicate' });
    expect(disabledItem).toBeDisabled();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Menu label="Actions" items={items(() => {})} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Menu label="Actions" items={items(() => {})} />
        <button type="button">outside</button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Menu label="Actions" items={items(() => {})} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] button')).toBeInTheDocument();
  });
});
