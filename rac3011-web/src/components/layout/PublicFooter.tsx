import { Link } from 'react-router';
import { useSurfaceHref } from '@/app/host';

const COLUMNS = [
  {
    heading: 'The District',
    links: [
      { label: 'Clubs & map', to: '/map' },
      { label: 'Leadership', to: '/leadership' },
      { label: 'Heritage', to: '/heritage' },
      { label: 'Initiatives', to: '/initiatives' },
      { label: 'Achievements', to: '/achievements' },
    ],
  },
  {
    heading: 'Get Involved',
    links: [
      { label: 'Open a new club', to: '/get-involved/new-club' },
      { label: 'Sponsor a project', to: '/get-involved/sponsor' },
      { label: 'Career Bridge', to: '/careerbridge/opportunities', surface: 'careerbridge' as const },
      { label: 'Partner with us', to: '/partners' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    heading: 'For Members',
    links: [
      { label: 'Club portal', to: '/portal/login' },
      { label: 'Resource hub', to: '/resources' },
      { label: 'Publications', to: '/publications' },
      { label: 'District calendar', to: '/calendar' },
      { label: 'Book the DRR', to: '/drr-calendar' },
    ],
  },
];

export interface PublicFooterProps {
  visits?: number;
}

export function PublicFooter({ visits }: PublicFooterProps) {
  const year = new Date().getFullYear();
  const careerBridgeHref = useSurfaceHref('careerbridge');
  return (
    <footer className="bg-[#18181B] px-5 pb-6 pt-10 md:px-8 md:pt-12 lg:px-10 lg:pt-[52px]">
      <div className="grid grid-cols-1 gap-9 border-b border-white/10 pb-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10 lg:pb-9">
        <div>
          <img src="/district-logo.png" alt="Rotaract District Organization 3011" className="mb-4 h-[26px] w-auto" />
          <p className="m-0 mb-3 max-w-[330px] text-[16px] font-bold leading-snug text-white">
            It all starts with Rotaract and everything good happens.
          </p>
          <p className="m-0 max-w-[330px] text-[11.5px] leading-relaxed text-white/55">
            Delhi &amp; National Capital Region, India. Part of Rotary International.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="m-0 mb-3.5 text-[10.5px] font-bold tracking-[1.2px] text-pink-bright">{col.heading.toUpperCase()}</p>
            <div className="flex flex-col gap-2.5 text-[12.5px] text-white/72">
              {col.links.map((link) =>
                'surface' in link ? (
                  <a key={link.to} href={careerBridgeHref ?? '#'} className="text-white/72 transition-colors hover:text-white">
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.to} to={link.to} className="text-white/72 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 pt-5 text-[11.5px] text-white/62 sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} Rotaract District Organization 3011</span>
        <span>{typeof visits === 'number' ? `${visits.toLocaleString('en-IN')} visits this year · counted server-side` : null}</span>
      </div>
    </footer>
  );
}
