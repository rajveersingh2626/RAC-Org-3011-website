import type { ReactNode } from 'react';
import { ThemeProvider } from '@/app/theme';
import { ToastProvider } from '@/components/ui/Toast';

// Lighter than app Providers: skips AuthProvider's /me round-trip (see docs/decisions.md).
export function UiKitProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
