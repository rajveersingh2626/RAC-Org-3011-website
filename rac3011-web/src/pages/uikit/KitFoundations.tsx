import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

export function KitFoundations() {
  return (
    <KitSection title="Foundations" description="Theme-aware primitives other components build on.">
      <KitGrid>
        <KitEntry name="ThemeToggle" note="shares one global preference across both panels">
          <ThemeToggle />
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
