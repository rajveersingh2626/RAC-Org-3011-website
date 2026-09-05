import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { IconButton } from '@/components/ui/IconButton';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Modal } from '@/components/ui/Modal';
import { Popover } from '@/components/ui/Popover';
import { Tooltip } from '@/components/ui/Tooltip';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

const MENU_ITEMS: MenuItem[] = [
  { id: 'edit', label: 'Edit', onSelect: () => undefined, kbd: '⌘E' },
  { id: 'duplicate', label: 'Duplicate', onSelect: () => undefined },
  { type: 'separator', id: 'sep-1' },
  { id: 'delete', label: 'Delete', onSelect: () => undefined, destructive: true },
];

export function KitOverlays() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <KitSection title="Overlays" description="Modal, drawer, popover, tooltip, and menu triggers.">
      <KitGrid>
        <KitEntry name="Modal">
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirm submission"
            description="You cannot edit this report after submitting."
            footer={
              <>
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setModalOpen(false)}>
                  Submit
                </Button>
              </>
            }
          >
            Submitting locks this report from further edits.
          </Modal>
        </KitEntry>
        <KitEntry name="Drawer">
          <Button size="sm" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Filters"
            side="right"
            footer={
              <Button size="sm" onClick={() => setDrawerOpen(false)}>
                Apply
              </Button>
            }
          >
            Filter controls go here.
          </Drawer>
        </KitEntry>
        <KitEntry name="Popover">
          <Popover label="Details">This club has filed 6 of 6 reports on time.</Popover>
        </KitEntry>
        <KitEntry name="Tooltip">
          <Tooltip content="District Representative">
            <IconButton label="Info">
              <Info />
            </IconButton>
          </Tooltip>
        </KitEntry>
        <KitEntry name="Menu">
          <Menu label="Row actions" items={MENU_ITEMS} />
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
