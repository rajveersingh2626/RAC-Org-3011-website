import { useDocumentMeta } from '@/lib/meta';
import { KitActions } from './uikit/KitActions';
import { KitDataDisplayA } from './uikit/KitDataDisplayA';
import { KitDataDisplayB } from './uikit/KitDataDisplayB';
import { KitFeedback } from './uikit/KitFeedback';
import { KitFormsAdvanced } from './uikit/KitFormsAdvanced';
import { KitFormsBasic } from './uikit/KitFormsBasic';
import { KitFoundations } from './uikit/KitFoundations';
import { KitLayout } from './uikit/KitLayout';
import { KitNavigation } from './uikit/KitNavigation';
import { KitOverlays } from './uikit/KitOverlays';
import { ThemePanel } from './uikit/ThemePanel';
import { UiKitProviders } from './uikit/UiKitProviders';

function KitSections() {
  return (
    <>
      <KitFoundations />
      <KitActions />
      <KitFormsBasic />
      <KitFormsAdvanced />
      <KitDataDisplayA />
      <KitDataDisplayB />
      <KitNavigation />
      <KitOverlays />
      <KitFeedback />
      <KitLayout />
    </>
  );
}

export function UiKitPage() {
  useDocumentMeta({ title: 'UI kit' });
  return (
    <UiKitProviders>
      <div data-theme="light" className="min-h-screen bg-page p-6 text-fg">
        <header className="mx-auto mb-8 max-w-[1400px]">
          <h1 className="m-0 text-2xl font-extrabold text-fg">UI kit</h1>
          <p className="m-0 mt-1.5 max-w-[70ch] text-[13.5px] text-fg-2">
            Every primitive in <code>src/components/ui/</code>, rendered light and dark side by side.
          </p>
        </header>
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 xl:grid-cols-2">
          <ThemePanel theme="light">
            <KitSections />
          </ThemePanel>
          <ThemePanel theme="dark">
            <KitSections />
          </ThemePanel>
        </div>
      </div>
    </UiKitProviders>
  );
}
