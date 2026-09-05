import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { InlineStatus } from '@/components/ui/InlineStatus';
import { useToast } from '@/components/ui/Toast';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

export function KitFeedback() {
  const { toast } = useToast();

  return (
    <KitSection title="Feedback" description="Toasts, alerts, and inline link-check status.">
      <KitGrid>
        <KitEntry name="Toast" note="uses the page's single ToastProvider">
          <Button size="sm" onClick={() => toast({ title: 'Report submitted', body: 'September report is now under review.' })}>
            Fire a toast
          </Button>
        </KitEntry>
        <KitEntry name="Alert — tones">
          <div className="flex flex-col gap-2">
            <Alert tone="info" title="Heads up">
              Reports are due on the 5th of every month.
            </Alert>
            <Alert tone="action" title="Action needed" action={<Button size="sm">Review</Button>}>
              3 reports awaiting review.
            </Alert>
            <Alert tone="warning" title="Deadline approaching">
              2 days left to file September&apos;s report.
            </Alert>
            <Alert tone="error" title="Submission failed">
              Check the highlighted fields and try again.
            </Alert>
          </div>
        </KitEntry>
        <KitEntry name="InlineStatus — states">
          <div className="flex flex-col gap-1.5">
            <InlineStatus state="checking" />
            <InlineStatus state="ok" />
            <InlineStatus state="broken" />
            <InlineStatus state="private" />
          </div>
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
