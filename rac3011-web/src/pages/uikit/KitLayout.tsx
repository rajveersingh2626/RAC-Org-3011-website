import { Container } from '@/components/ui/Container';
import { Divider } from '@/components/ui/Divider';
import { Kbd } from '@/components/ui/Kbd';
import { Section as UiSection } from '@/components/ui/Section';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

export function KitLayout() {
  return (
    <KitSection title="Layout & utility" description="Structural primitives: containers, sections, dividers, and a11y helpers.">
      <KitGrid>
        <KitEntry name="Container — widths">
          <div className="flex flex-col gap-1.5 text-[11px] text-fg-3">
            <Container width="narrow" className="rounded border border-dashed border-line px-2 py-1">
              narrow
            </Container>
            <Container width="default" className="rounded border border-dashed border-line px-2 py-1">
              default
            </Container>
            <Container width="wide" className="rounded border border-dashed border-line px-2 py-1">
              wide
            </Container>
          </div>
        </KitEntry>
        <KitEntry name="Section" className="sm:col-span-2">
          <UiSection eyebrow="District" title="Upcoming events" description="A self-contained section with eyebrow, title, and description.">
            Section body content renders here.
          </UiSection>
        </KitEntry>
        <KitEntry name="Divider">
          <div className="flex flex-col gap-3">
            <Divider />
            <Divider label="or" />
          </div>
        </KitEntry>
        <KitEntry name="Kbd">
          <div className="flex items-center gap-1.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>
        </KitEntry>
        <KitEntry name="VisuallyHidden">
          <p className="text-[11.5px] text-fg-2">
            <VisuallyHidden>Screen-reader-only text: </VisuallyHidden>
            Visible label
          </p>
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
