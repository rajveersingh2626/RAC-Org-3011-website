import type { ReactNode } from 'react';
import type { Theme } from '@/app/theme';

interface ThemePanelProps {
  theme: Theme;
  children: ReactNode;
}

export function ThemePanel({ theme, children }: ThemePanelProps) {
  return (
    <div data-theme={theme} className="flex flex-col gap-10 rounded-[16px] border border-line bg-page p-5 text-fg">
      <p className="m-0 text-[9px] font-bold uppercase tracking-[1px] text-accent">{theme} theme</p>
      {children}
    </div>
  );
}
