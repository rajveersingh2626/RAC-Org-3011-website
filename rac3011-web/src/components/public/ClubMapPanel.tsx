import { Link } from 'react-router';
import { Mail, MessageCircle, X } from 'lucide-react';
import type { ClubSummary } from '@/lib/publicApi/clubs';
import { whatsappLink } from '@/lib/publicApi/clubs';
import { IconButton } from '@/components/ui/IconButton';
import { KeyValue } from '@/components/ui/KeyValue';
import { Avatar } from '@/components/ui/Avatar';

interface ClubMapPanelProps {
  club: ClubSummary;
  onClose: () => void;
}

export function ClubMapPanel({ club, onClose }: ClubMapPanelProps) {
  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto rounded-[16px] border border-line-accent bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={club.name} src={club.logoUrl ?? undefined} size="lg" />
          <div>
            <h2 className="m-0 text-[16px] font-extrabold text-fg">{club.name}</h2>
            {club.president ? <p className="m-0 text-[12px] text-fg-3">President: {club.president}</p> : null}
          </div>
        </div>
        <IconButton label="Close club panel" onClick={onClose}>
          <X aria-hidden />
        </IconButton>
      </div>

      <KeyValue
        items={[
          { label: 'Members', value: club.memberCount },
          { label: 'Zone', value: club.zoneId ?? 'Not set' },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {club.phone ? (
          <a
            href={whatsappLink(club.phone)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[8px] border border-line-accent px-3.5 text-[12.5px] font-bold text-fg-2 hover:bg-accent-soft"
          >
            <MessageCircle aria-hidden className="size-4" /> WhatsApp
          </a>
        ) : null}
        {club.email ? (
          <a
            href={`mailto:${club.email}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[8px] border border-line-accent px-3.5 text-[12.5px] font-bold text-fg-2 hover:bg-accent-soft"
          >
            <Mail aria-hidden className="size-4" /> Email
          </a>
        ) : null}
      </div>

      {club.slug ? (
        <Link
          to={`/leadership/clubs/${club.slug}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[8px] border-2 border-accent px-5 text-[13.5px] font-bold text-accent hover:bg-accent-soft"
        >
          View full club profile
        </Link>
      ) : null}
    </aside>
  );
}
