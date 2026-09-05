import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { KeyValue } from '@/components/ui/KeyValue';
import { Table, type Column } from '@/components/ui/Table';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

interface ClubRow {
  id: string;
  club: string;
  points: number;
}

const CLUB_ROWS: ClubRow[] = [
  { id: '1', club: 'Dynamic Leaders', points: 1240 },
  { id: '2', club: 'BraveHearts', points: 980 },
];

const CLUB_COLUMNS: Column<ClubRow>[] = [
  { key: 'club', header: 'Club', cell: (r) => r.club },
  { key: 'points', header: 'Points', cell: (r) => r.points, numeric: true },
];

export function KitDataDisplayA() {
  const [tags, setTags] = useState(['Fundraising', 'Media']);

  return (
    <KitSection title="Data display — content" description="Cards, badges, chips, tables, and media slots.">
      <KitGrid>
        <KitEntry name="Card">
          <Card eyebrow="Flagship" title="Mahadan 9.0" footer={<Button size="sm">View</Button>}>
            Blood donation drive across 5 zones.
          </Card>
        </KitEntry>
        <KitEntry name="Badge — tones">
          <div className="flex flex-wrap gap-1.5">
            <Badge>Neutral</Badge>
            <Badge tone="pink">Pink</Badge>
            <Badge tone="green">Green</Badge>
            <Badge tone="amber">Amber</Badge>
            <Badge tone="red">Red</Badge>
            <Badge tone="blue">Blue</Badge>
          </div>
        </KitEntry>
        <KitEntry name="Chip">
          <div className="flex flex-wrap gap-1.5">
            <Chip selected count={4}>
              Selected
            </Chip>
            {tags.map((tag) => (
              <Chip key={tag} label={tag} onRemove={() => setTags((t) => t.filter((x) => x !== tag))} />
            ))}
          </div>
        </KitEntry>
        <KitEntry name="Avatar — sizes">
          <div className="flex items-center gap-2">
            <Avatar name="Devika Jain" size="sm" />
            <Avatar name="Karan Kapoor" size="md" />
            <Avatar name="Priya Joshi" size="lg" />
            <Avatar name="Rahul Bansal" size="xl" />
          </div>
        </KitEntry>
        <KitEntry name="KeyValue">
          <KeyValue
            items={[
              { label: 'Club', value: 'Dynamic Leaders' },
              { label: 'Zone', value: '3' },
            ]}
          />
        </KitEntry>
        <KitEntry name="ImageSlot — fallback">
          <ImageSlot src={undefined} alt="Club banner" prompt="No banner uploaded" ratio="4:3" />
        </KitEntry>
        <KitEntry name="Table" className="sm:col-span-2">
          <Table columns={CLUB_COLUMNS} rows={CLUB_ROWS} rowKey={(r) => r.id} caption="Top clubs by points" empty="No clubs yet" />
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
