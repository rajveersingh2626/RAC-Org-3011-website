import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { fetchClubs, zoneChipsFrom, type ClubSummary } from '@/lib/publicApi/clubs';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ClubMapPanel } from '@/components/public/ClubMapPanel';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const DISTRICT_CENTER: [number, number] = [28.6139, 77.209];

export function MapPage() {
  useDocumentMeta({ title: 'Clubs & Map', description: 'Every Rotaract club in District 3011, mapped by zone.' });
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'clubs'], queryFn: () => fetchClubs() });
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ClubSummary | null>(null);
  const [tilesFailed, setTilesFailed] = useState(false);

  const clubs = data?.items ?? [];
  const zoneChips = useMemo(() => zoneChipsFrom(data?.items ?? []), [data]);
  const filtered = zoneId ? clubs.filter((c) => c.zoneId === zoneId) : clubs;
  const withCoords = filtered.filter((c) => c.lat != null && c.lng != null);
  const withoutCoords = filtered.filter((c) => c.lat == null || c.lng == null);

  if (isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-[420px]" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load the club map" onRetry={() => void refetch()} />
      </Container>
    );
  }

  return (
    <Container>
      <Section eyebrow="District 3011" title="Clubs & map" description={`${clubs.length} clubs across the district.`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip selected={zoneId === null} onClick={() => setZoneId(null)}>
            All zones
          </Chip>
          {zoneChips.map((z) => (
            <Chip key={z.id} selected={zoneId === z.id} onClick={() => setZoneId(z.id)}>
              {z.label}
            </Chip>
          ))}
        </div>

        {tilesFailed ? (
          <div className="mb-3">
            <Alert tone="warning" title="Map tiles failed to load">
              Check your connection. The club list below still works.
            </Alert>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState title="No clubs in this zone yet" body="Try another zone or clear the filter." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
            <div className="h-[420px] overflow-hidden rounded-[16px] border border-line-accent">
              <MapContainer center={DISTRICT_CENTER} zoom={10} scrollWheelZoom className="size-full">
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  eventHandlers={{ tileerror: () => setTilesFailed(true) }}
                />
                {withCoords.map((club) => (
                  <Marker
                    key={club.id}
                    position={[club.lat as number, club.lng as number]}
                    eventHandlers={{ click: () => setSelected(club) }}
                  />
                ))}
              </MapContainer>
            </div>
            {selected ? (
              <ClubMapPanel club={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="rounded-[16px] border border-dashed border-line p-5 text-[13px] text-fg-2">
                Click a pin to see the club&apos;s details, WhatsApp and email.
              </div>
            )}
          </div>
        )}

        {withoutCoords.length > 0 ? (
          <div className="mt-6">
            <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[1px] text-fg-3">
              Clubs without map coordinates yet
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {withoutCoords.map((club) => (
                <li key={club.id}>
                  <Link
                    to={club.slug ? `/leadership/clubs/${club.slug}` : '/map'}
                    className="inline-flex min-h-11 items-center rounded-[8px] border border-line-accent px-3 text-[12.5px] font-bold text-fg-2 hover:bg-accent-soft"
                  >
                    {club.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>
    </Container>
  );
}
