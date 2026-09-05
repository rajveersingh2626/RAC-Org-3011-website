import { useState } from 'react';
import { Home, LayoutDashboard, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Pagination } from '@/components/ui/Pagination';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SideNav, type SideNavGroup } from '@/components/ui/SideNav';
import { Stepper } from '@/components/ui/Stepper';
import { Tabs } from '@/components/ui/Tabs';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

const SIDE_NAV_GROUPS: SideNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', href: '#dashboard', icon: <LayoutDashboard /> },
      { key: 'club', label: 'My club', href: '#club', icon: <Home /> },
    ],
  },
  {
    label: 'Admin',
    items: [{ key: 'members', label: 'Members', href: '#members', icon: <Users /> }],
  },
];

export function KitNavigation() {
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(3);
  const [density, setDensity] = useState('comfortable');

  return (
    <KitSection title="Navigation" description="Tabs, breadcrumbs, pagination, steppers, and the portal side nav.">
      <KitGrid>
        <KitEntry name="Tabs">
          <Tabs
            label="Report sections"
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'activities', label: 'Activities', badge: <span className="text-fg-3">(3)</span> },
            ]}
            value={tab}
            onChange={setTab}
          >
            {tab === 'overview' ? 'Overview panel content.' : 'Activities panel content.'}
          </Tabs>
        </KitEntry>
        <KitEntry name="Breadcrumbs">
          <Breadcrumbs
            items={[{ label: 'Portal', href: '#portal' }, { label: 'Reports', href: '#reports' }, { label: 'September' }]}
          />
        </KitEntry>
        <KitEntry name="Pagination">
          <Pagination label="Reports" page={page} totalPages={12} onChange={setPage} />
        </KitEntry>
        <KitEntry name="Stepper">
          <Stepper
            label="Report wizard"
            currentId="review"
            steps={[
              { id: 'details', label: 'Details' },
              { id: 'activities', label: 'Activities' },
              { id: 'review', label: 'Review' },
            ]}
          />
        </KitEntry>
        <KitEntry name="SegmentedControl">
          <SegmentedControl
            label="Density"
            value={density}
            onChange={setDensity}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
          />
        </KitEntry>
        <KitEntry name="SideNav" className="sm:col-span-2">
          <div className="max-w-xs overflow-hidden rounded-[12px]">
            <SideNav label="Portal navigation" groups={SIDE_NAV_GROUPS} activeHref="#dashboard" />
          </div>
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
