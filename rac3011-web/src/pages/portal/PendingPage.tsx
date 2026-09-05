import { Link } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { Button } from '@/components/ui/Button';

export function PendingPage() {
  useDocumentMeta({ title: 'Registration pending' });
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-[460px] rounded-[16px] border border-line-accent bg-surface p-8 text-center shadow-raised">
        <img
          src="/district-logo.png"
          alt="Rotaract District Organization 3011"
          className="mx-auto mb-6 h-8 w-auto"
        />
        <h1 className="m-0 mb-2 text-[22px] font-extrabold tracking-tight text-fg">Almost there</h1>
        <p className="m-0 mb-6 text-[13.5px] text-fg-2">
          Your club&apos;s president or secretary needs to approve your account before you can sign in. This
          usually takes a day or two &ndash; we&apos;ll let you know by email once it&apos;s done.
        </p>
        <Link to="/portal/login">
          <Button variant="secondary" block>
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
