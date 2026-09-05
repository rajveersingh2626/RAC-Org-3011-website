import type { ReactNode } from 'react';
import { PortalShell } from './PortalShell';

export function AdminShell({ children }: { children: ReactNode }) {
  return <PortalShell adminOpenDefault>{children}</PortalShell>;
}
