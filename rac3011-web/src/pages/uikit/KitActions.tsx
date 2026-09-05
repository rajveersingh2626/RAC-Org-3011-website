import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

export function KitActions() {
  return (
    <KitSection title="Actions" description="Buttons and icon buttons across every variant, size, and state.">
      <KitGrid>
        <KitEntry name="Button — variants">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
            <Button variant="soft">Soft</Button>
          </div>
        </KitEntry>
        <KitEntry name="Button — sizes">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </KitEntry>
        <KitEntry name="Button — states">
          <div className="flex flex-wrap items-center gap-2">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button leading={<Plus className="size-4" />}>Leading icon</Button>
            <Button trailing={<ArrowRight className="size-4" />}>Trailing icon</Button>
          </div>
        </KitEntry>
        <KitEntry name="Button — block">
          <Button block>Full width</Button>
        </KitEntry>
        <KitEntry name="IconButton — variants" className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <IconButton label="Add" variant="primary">
              <Plus />
            </IconButton>
            <IconButton label="Add" variant="soft">
              <Plus />
            </IconButton>
            <IconButton label="Delete" variant="ghost">
              <Trash2 />
            </IconButton>
            <IconButton label="Delete" variant="ghost" disabled>
              <Trash2 />
            </IconButton>
          </div>
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
