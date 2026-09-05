import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/theme';
import { IconButton } from './IconButton';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <IconButton label="Toggle dark mode" aria-pressed={dark} onClick={toggle} className={className}>
      {dark ? <Moon /> : <Sun />}
    </IconButton>
  );
}
