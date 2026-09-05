import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Menu as MenuIcon, Globe, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { mainSiteHref, type Surface } from '@/app/host';
import { Drawer } from '@/components/ui/Drawer';
import { cn } from '@/lib/cn';
import Footer from '@/user_frontend/components/Layout/Footer';

export interface SubdomainNavLink {
  label: string;
  to: string;
}

export interface SubdomainShellProps {
  surface: Exclude<Surface, 'main'>;
  title: string;
  nav: SubdomainNavLink[];
  children: ReactNode;
}

export function SubdomainShell({ surface, title, nav, children }: SubdomainShellProps) {
  const { me } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-surface', surface);
    return () => document.documentElement.removeAttribute('data-surface');
  }, [surface]);

  return (
    <div className="flex min-h-screen flex-col bg-page">
      {/* Signature Top Accent Bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#D81B60] via-[#123499] to-[#880E4F]" />

      {/* Main Glass Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#0F1218] px-4 md:px-8 shadow-md">
        <div className="flex items-center gap-4 md:gap-7">
          {/* Mobile Menu Trigger */}
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-white lg:hidden"
          >
            <MenuIcon aria-hidden className="size-5" />
          </button>

          {/* District 3011 Logo */}
          <a href={mainSiteHref()} className="flex items-center gap-3 shrink-0" title="Return to Rotaract District 3011 Home">
            <img src="/district-logo.png" alt="Rotaract District Organization 3011" className="h-7 w-auto brightness-0 invert" />
          </a>

          {/* Initiative Badge */}
          <span className="hidden sm:inline-flex items-center rounded-full bg-[#D81B60]/20 border border-[#D81B60]/40 px-3 py-1 text-[11.5px] font-extrabold text-[#FF6B8B] tracking-wider uppercase shadow-xs">
            {title}
          </span>

          {/* Subdomain Desktop Navigation Links */}
          <nav aria-label="Initiative navigation" className="hidden items-center gap-1.5 lg:flex">
            {nav.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'px-3.5 py-1.5 rounded-[8px] text-[13px] font-bold transition-all',
                    isActive
                      ? 'bg-[#D81B60] text-white shadow-xs'
                      : 'text-white/75 hover:text-white hover:bg-white/10',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Main Website Link */}
          <a
            href={mainSiteHref()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-[#D81B60]/25 hover:border-[#D81B60]/50 text-white/90 hover:text-white px-3 py-1.5 text-[12px] font-bold transition-all shadow-xs"
            title="Return to Main District Website"
          >
            <Globe size={13} className="text-[#FF4081]" />
            <span className="hidden sm:inline">District Website</span>
          </a>

          {/* Portal Access */}
          <a
            href="/portal/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D81B60] bg-[#D81B60] hover:bg-[#AD1457] text-white px-3.5 py-1.5 text-[12px] font-bold transition-all shadow-xs"
            title="District Portal Login"
          >
            <LayoutDashboard size={13} />
            <span className="hidden sm:inline">Portal</span>
          </a>

          {me && (
            <span className="hidden xl:inline-block text-[12px] font-semibold text-white/60">
              {me.user.name}
            </span>
          )}
        </div>
      </header>

      {/* Subdomain Main Viewport */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-8 md:px-8">
        {children}
      </main>

      {/* Shared Unified Footer */}
      <Footer />

      {/* Mobile Drawer Navigation */}
      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title={title} side="left">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1 border-b border-line-accent pb-4">
            <p className="mb-2 text-[11px] font-extrabold tracking-[1.2px] text-accent uppercase">Initiative Pages</p>
            {nav.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-10 items-center rounded-[8px] px-3.5 text-[13px] font-semibold transition-all',
                    isActive
                      ? 'bg-[#FDF0F5] text-[#D81B60] font-bold shadow-xs'
                      : 'text-fg-2 hover:bg-[#FDF0F5]/70 hover:text-[#D81B60]',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={mainSiteHref()}
              className="flex min-h-10 items-center gap-2 rounded-[8px] px-3.5 text-[13px] font-bold text-fg hover:bg-surface-elevated"
            >
              <Globe size={15} className="text-accent" /> Main District Website
            </a>
            <a
              href="/portal/login"
              className="flex min-h-10 items-center gap-2 rounded-[8px] px-3.5 text-[13px] font-bold text-accent hover:bg-accent-soft"
            >
              <LayoutDashboard size={15} /> District Portal Access
            </a>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
