import { useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { Menu as MenuIcon, Globe, ExternalLink } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { useTheme } from '@/app/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Drawer } from '@/components/ui/Drawer';
import { cn } from '@/lib/cn';
import { PORTAL_NAV_GROUPS, type NavGroup } from './portalNav';

function visibleGroups(groups: NavGroup[], can: (perm: string) => boolean): NavGroup[] {
  return groups
    .filter((g) => !g.perm || can(g.perm))
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(i.perm)) }))
    .filter((g) => g.items.length > 0);
}

function NavLinkItem({ to, label, onClick, external }: { to: string; label: string; onClick?: () => void; external?: boolean }) {
  if (external) {
    return (
      <a
        href={to}
        onClick={onClick}
        className="flex min-h-10 items-center justify-between rounded-[8px] px-3.5 text-[13px] font-semibold text-[#4A4A5A] transition-all hover:bg-[#FDF0F5]/70 hover:text-[#D81B60]"
      >
        <span>{label}</span>
        <ExternalLink size={12} className="opacity-50" />
      </a>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex min-h-10 items-center rounded-[8px] px-3.5 text-[13px] font-semibold transition-all',
          isActive
            ? 'bg-[#FDF0F5] text-[#D81B60] border-l-4 border-l-[#D81B60] border-y border-r border-[#F3E5EB] font-bold shadow-xs'
            : 'text-[#4A4A5A] hover:bg-[#FDF0F5]/70 hover:text-[#D81B60]',
        )
      }
    >
      {label}
    </NavLink>
  );
}

function GroupList({ groups, adminOpenDefault, onNavigate }: { groups: NavGroup[]; adminOpenDefault: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Portal" className="flex flex-col gap-5">
      {groups.map((group) =>
        group.key === 'admin' ? (
          <details key={group.key} open={adminOpenDefault} className="group">
            <summary className="mb-2 cursor-pointer list-none text-[11px] font-extrabold tracking-[1.2px] text-[#123499]">
              {group.label.toUpperCase()}
            </summary>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavLinkItem key={item.key} to={item.to} label={item.label} onClick={onNavigate} external={item.external} />
              ))}
            </div>
          </details>
        ) : (
          <div key={group.key}>
            <p className="mb-2 text-[11px] font-extrabold tracking-[1.2px] text-[#123499]">{group.label.toUpperCase()}</p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavLinkItem key={item.key} to={item.to} label={item.label} onClick={onNavigate} external={item.external} />
              ))}
            </div>
          </div>
        ),
      )}
    </nav>
  );
}

function ScopeSwitcher() {
  const { me } = useAuth();
  if (!me || me.clubs.length === 0) return null;
  if (me.clubs.length === 1) {
    const club = me.clubs[0];
    const role = me.roles[0]?.roleKey ?? 'member';
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11.5px] font-semibold text-white/90">
        <span className="size-1.5 rounded-full bg-[#D81B60]" />
        {club.shortName} · {role}
      </span>
    );
  }
  const items: MenuItem[] = me.clubs.map((club) => ({ id: club.id, label: club.name, onSelect: () => undefined }));
  return (
    <Menu
      label={me.clubs[0].shortName}
      items={items}
      triggerClassName="border-white/20 bg-white/10 hover:bg-white/15 text-white min-h-9 py-1 px-3 rounded-full text-[12px] font-bold"
    />
  );
}

function UserMenu() {
  const { me, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  if (!me) return null;
  const items: MenuItem[] = [
    { id: 'website', label: 'Return to District Website', onSelect: () => { window.location.href = '/'; } },
    { id: 'theme', label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', onSelect: toggle },
    { id: 'sep', type: 'separator' },
    { id: 'signout', label: 'Sign out', onSelect: () => void signOut(), destructive: true },
  ];
  return (
    <Menu
      align="end"
      triggerClassName="border-white/20 bg-white/10 hover:bg-white/15 hover:border-white/30 text-white min-h-9 py-1 px-2.5 rounded-full shadow-xs"
      label={
        <span className="flex items-center gap-2">
          <Avatar name={me.user.name} src={me.profile?.photoUrl ?? undefined} size="sm" />
          <span className="hidden text-[12.5px] font-bold text-white sm:inline">{me.user.name}</span>
        </span>
      }
      items={items}
    />
  );
}

export interface PortalShellProps {
  children: ReactNode;
  adminOpenDefault?: boolean;
}

export function PortalShell({ children, adminOpenDefault = false }: PortalShellProps) {
  const { me, can } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const groups = useMemo(() => visibleGroups(PORTAL_NAV_GROUPS, (perm) => can(perm)), [me, can]);

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="relative flex h-[62px] shrink-0 items-center justify-between bg-[#0F1218] px-4 lg:px-7 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D81B60] via-[#123499] to-[#880E4F]" />
        <div className="flex items-center gap-5 lg:gap-[26px]">
          <button
            type="button"
            aria-label="Open portal menu"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-white lg:hidden"
          >
            <MenuIcon aria-hidden className="size-5" />
          </button>
          <Link to="/portal/dashboard" className="flex items-center">
            <img src="/district-logo.png" alt="Rotaract District Organization 3011" className="h-7 w-auto brightness-0 invert" />
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-[#D81B60]/25 hover:border-[#D81B60]/50 text-white/90 hover:text-white px-3 py-1 text-[12px] font-bold transition-all shadow-xs"
            title="Return to Main District Website"
          >
            <Globe size={13} className="text-[#FF4081]" />
            <span className="hidden sm:inline">District Website</span>
          </a>
          <ScopeSwitcher />
          <UserMenu />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-8 px-4 py-6 lg:px-7">
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <GroupList groups={groups} adminOpenDefault={adminOpenDefault} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Menu" side="left">
        <GroupList groups={groups} adminOpenDefault={adminOpenDefault} onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>
    </div>
  );
}
