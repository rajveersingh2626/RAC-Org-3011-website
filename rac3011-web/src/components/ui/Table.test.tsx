import { render, screen, within } from '@testing-library/react';
import { Table, type Column } from './Table';

interface Row {
  id: string;
  activity: string;
  reached: number;
}

const columns: Column<Row>[] = [
  { key: 'activity', header: 'Activity', cell: (r) => r.activity },
  { key: 'reached', header: 'Reached', cell: (r) => r.reached, numeric: true },
];

const rows: Row[] = [
  { id: 'a', activity: 'Blood donation camp', reached: 180 },
  { id: 'b', activity: 'Tree plantation', reached: 60 },
];

describe('Table', () => {
  it('renders headers and cells', () => {
    render(<Table columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByRole('columnheader', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Reached' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Blood donation camp/ })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });
  it('echoes the column header per cell for the mobile stack', () => {
    const { container } = render(<Table columns={columns} rows={rows} rowKey={(r) => r.id} />);
    const cells = container.querySelectorAll('tbody td');
    expect(cells).toHaveLength(4);
    expect(cells[0]).toHaveAttribute('data-label', 'Activity');
    expect(cells[1]).toHaveAttribute('data-label', 'Reached');
    expect(within(cells[0] as HTMLElement).getByText('Activity').className).toMatch(/md:hidden/);
  });
  it('keeps real table semantics and hides thead only until md', () => {
    const { container } = render(<Table columns={columns} rows={rows} rowKey={(r) => r.id} caption="July 2026" />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    const thead = container.querySelector('thead');
    expect(thead?.className).toMatch(/hidden/);
    expect(thead?.className).toMatch(/md:table-header-group/);
    expect(thead?.className).toMatch(/border-t-2/);
    expect(screen.getByText('July 2026').tagName).toBe('CAPTION');
  });
  it('right-aligns and tabular-nums numeric columns', () => {
    const { container } = render(<Table columns={columns} rows={rows} rowKey={(r) => r.id} />);
    const numericCell = container.querySelectorAll('tbody td')[1] as HTMLElement;
    expect(numericCell.className).toMatch(/tabular-nums/);
    expect(numericCell.className).toMatch(/md:text-right/);
  });
  it('renders the empty node across the full width', () => {
    render(<Table columns={columns} rows={[]} rowKey={(r) => r.id} empty="No activities yet" />);
    const cell = screen.getByRole('cell', { name: 'No activities yet' });
    expect(cell).toHaveAttribute('colspan', '2');
  });
  it('renders in dark theme', () => {
    const { container } = render(
      <div data-theme="dark">
        <Table columns={columns} rows={rows} rowKey={(r) => r.id} />
      </div>,
    );
    expect(container.querySelector('[data-theme="dark"] table')).toBeInTheDocument();
  });
});
