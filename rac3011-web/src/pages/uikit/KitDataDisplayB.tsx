import { FolderOpen } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RadialGauge } from '@/components/ui/RadialGauge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Stat } from '@/components/ui/Stat';
import { Timeline } from '@/components/ui/Timeline';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

export function KitDataDisplayB() {
  return (
    <KitSection title="Data display — status" description="Stats, gauges, progress, timelines, and placeholder states.">
      <KitGrid>
        <KitEntry name="Stat">
          <Stat label="Reports filed" value="42" delta={{ text: '+12%', tone: 'up' }} hint="vs last month" />
        </KitEntry>
        <KitEntry name="RadialGauge" note="value can exceed max (130/100)">
          <RadialGauge value={130} max={100} sublabel="Points vs target" />
        </KitEntry>
        <KitEntry name="ProgressBar" note="value can exceed max (130/100)">
          <ProgressBar value={130} max={100} label="Fundraising" hint="₹1.3L of ₹1L" />
        </KitEntry>
        <KitEntry name="Timeline">
          <Timeline
            items={[
              { title: 'Report filed', meta: '2 Sep', state: 'done' },
              { title: 'Under review', meta: '3 Sep', state: 'current' },
              { title: 'Points published', state: 'todo' },
            ]}
          />
        </KitEntry>
        <KitEntry name="Skeleton — shapes">
          <div className="flex flex-col gap-3">
            <Skeleton shape="text" lines={3} />
            <div className="flex items-center gap-3">
              <Skeleton shape="circle" />
              <Skeleton shape="rect" className="flex-1" />
            </div>
          </div>
        </KitEntry>
        <KitEntry name="EmptyState">
          <EmptyState icon={<FolderOpen className="size-6" />} title="No reports yet" body="Reports you file will show up here." />
        </KitEntry>
        <KitEntry name="ErrorState" className="sm:col-span-2">
          <ErrorState body="Could not load the leaderboard." onRetry={() => undefined} />
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
