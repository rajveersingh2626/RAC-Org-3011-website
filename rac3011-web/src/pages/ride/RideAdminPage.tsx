import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { currentRyYear } from '@/lib/reports/month';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Table, type Column } from '@/components/ui/Table';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { FileUpload, type FileUploadValue } from '@/components/ui/FileUpload';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Trash2 } from 'lucide-react';
import {
  assignHosts,
  createDelegation,
  createGalleryItem,
  deleteGalleryItem,
  fetchDelegations,
  fetchGalleryItems,
  fetchSupportClubs,
} from '@/lib/ride/api';
import type { Delegation, DelegationStatus, GalleryItem, GalleryItemKind, SupportClub } from '@/lib/ride/types';
import { ApiError } from '@/lib/api';

const DELEGATIONS_KEY = ['ride', 'admin', 'delegations'];
const SUPPORT_CLUBS_KEY = ['ride', 'admin', 'support-clubs'];
const GALLERY_KEY = ['ride', 'admin', 'gallery'];

const STATUS_TONE: Record<DelegationStatus, BadgeTone> = {
  planned: 'neutral',
  confirmed: 'blue',
  completed: 'green',
  cancelled: 'red',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface CreateDelegationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateDelegationModal({ open, onClose, onCreated }: CreateDelegationModalProps) {
  const [ryYear, setRyYear] = useState(String(currentRyYear()));
  const [visitingDistrict, setVisitingDistrict] = useState('');
  const [country, setCountry] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createDelegation({
        ryYear: Number(ryYear),
        visitingDistrict: visitingDistrict.trim(),
        country: country.trim(),
        startsAt,
        endsAt,
        headcount: Number(headcount),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim() || null,
      }),
    onSuccess: () => {
      onCreated();
      onClose();
    },
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not add this delegation.'),
  });

  const valid =
    visitingDistrict.trim() && country.trim() && startsAt && endsAt && headcount.trim() && contactName.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a delegation"
      footer={
        <Button disabled={!valid} loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Add delegation
        </Button>
      }
    >
      <div className="flex flex-col gap-3.5">
        {error && (
          <Alert tone="error" title="Something went wrong">
            {error}
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Rotary year" required>
            <Input type="number" value={ryYear} onChange={(e) => setRyYear(e.target.value)} />
          </Field>
          <Field label="Visiting district" required>
            <Input value={visitingDistrict} onChange={(e) => setVisitingDistrict(e.target.value)} placeholder="e.g. D2680" maxLength={50} />
          </Field>
        </div>
        <Field label="Country" required>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={100} />
        </Field>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Starts" required>
            <DateInput value={startsAt} onChange={setStartsAt} />
          </Field>
          <Field label="Ends" required>
            <DateInput value={endsAt} onChange={setEndsAt} />
          </Field>
        </div>
        <Field label="Headcount" required>
          <Input type="number" min={1} value={headcount} onChange={(e) => setHeadcount(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Contact name" required>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={200} />
          </Field>
          <Field label="Contact email" hint="Optional">
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={200} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

interface HostRowState {
  included: boolean;
  daysHosted: string;
  membersSent: string;
}

interface HostAssignmentDrawerProps {
  delegation: Delegation | null;
  supportClubs: SupportClub[];
  onClose: () => void;
  onSaved: () => void;
}

function HostAssignmentDrawer({ delegation, supportClubs, onClose, onSaved }: HostAssignmentDrawerProps) {
  const [rows, setRows] = useState<Record<string, HostRowState>>({});
  const [error, setError] = useState<string | null>(null);

  // Re-seed local state whenever a different delegation opens.
  const [seededFor, setSeededFor] = useState<string | undefined>(undefined);
  if (delegation && seededFor !== delegation.id) {
    const next: Record<string, HostRowState> = {};
    for (const club of supportClubs) {
      const existing = delegation.hosts.find((h) => h.club.id === club.club.id);
      next[club.club.id] = {
        included: Boolean(existing),
        daysHosted: existing ? String(existing.daysHosted) : '',
        membersSent: existing ? String(existing.membersSent) : '0',
      };
    }
    setRows(next);
    setSeededFor(delegation.id);
  }

  const mutation = useMutation({
    mutationFn: () => {
      const hosts = Object.entries(rows)
        .filter(([, r]) => r.included)
        .map(([clubId, r]) => ({
          clubId,
          daysHosted: Number(r.daysHosted || 0),
          membersSent: Number(r.membersSent || 0),
        }));
      return assignHosts(delegation!.id, hosts);
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not save host assignments.'),
  });

  return (
    <Drawer
      open={Boolean(delegation)}
      onClose={onClose}
      title={delegation ? `Assign hosts — ${delegation.country}` : 'Assign hosts'}
      footer={
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Save host assignments
        </Button>
      }
    >
      {error && (
        <div className="mb-3">
          <Alert tone="error" title="Something went wrong">
            {error}
          </Alert>
        </div>
      )}
      {supportClubs.length === 0 ? (
        <EmptyState title="No registered support clubs" body="No club has registered to host this Rotary year yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {supportClubs.map((club) => {
            const row = rows[club.club.id] ?? { included: false, daysHosted: '', membersSent: '0' };
            return (
              <div key={club.club.id} className="rounded-[10px] border border-line p-3">
                <Checkbox
                  label={`${club.club.name} (capacity ${club.capacityDelegates}${club.homestayAvailable ? ', homestay' : ''})`}
                  checked={row.included}
                  onChange={(e) =>
                    setRows((prev) => ({ ...prev, [club.club.id]: { ...row, included: e.target.checked } }))
                  }
                />
                {row.included && (
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    <Field label="Days hosted">
                      <Input
                        type="number"
                        min={0}
                        value={row.daysHosted}
                        onChange={(e) =>
                          setRows((prev) => ({ ...prev, [club.club.id]: { ...row, daysHosted: e.target.value } }))
                        }
                      />
                    </Field>
                    <Field label="Members sent">
                      <Input
                        type="number"
                        min={0}
                        value={row.membersSent}
                        onChange={(e) =>
                          setRows((prev) => ({ ...prev, [club.club.id]: { ...row, membersSent: e.target.value } }))
                        }
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}

function GalleryAdminSection() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: GALLERY_KEY, queryFn: () => fetchGalleryItems({ pageSize: 200 }) });

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [kind, setKind] = useState<GalleryItemKind>('photo');
  const [photo, setPhoto] = useState<FileUploadValue | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: GALLERY_KEY });

  const createMutation = useMutation({
    mutationFn: () => {
      const url = kind === 'photo' ? (photo?.kind === 'file' ? photo.file.url : photo?.kind === 'link' ? photo.url : null) : videoUrl.trim();
      if (!url) throw new ApiError(400, 'Add a photo or a link first');
      return createGalleryItem({ year: Number(year), url, kind, caption: caption.trim() || null });
    },
    onSuccess: () => {
      invalidate();
      setPhoto(null);
      setVideoUrl('');
      setCaption('');
    },
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not add this item.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGalleryItem(id),
    onSuccess: invalidate,
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not remove this item.'),
  });

  const byYear = new Map<number, GalleryItem[]>();
  for (const item of query.data?.items ?? []) {
    byYear.set(item.year, [...(byYear.get(item.year) ?? []), item]);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <Section eyebrow="RIDE admin" title="Gallery" description="Manage the photos and videos shown on the public gallery page.">
      {error && (
        <div className="mb-3">
          <Alert tone="error" title="Something went wrong">
            {error}
          </Alert>
        </div>
      )}
      <div className="mb-6 grid grid-cols-1 gap-3.5 rounded-[14px] border border-line-accent p-4 sm:grid-cols-2">
        <Field label="Year" required>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </Field>
        <Field label="Kind" required>
          <Select value={kind} onChange={(e) => setKind(e.target.value as GalleryItemKind)} options={[
            { value: 'photo', label: 'Photo' },
            { value: 'video', label: 'Video' },
          ]} />
        </Field>
        {kind === 'photo' ? (
          <div className="sm:col-span-2">
            <Field label="Photo" hint="Upload a file, or paste a link">
              <FileUpload tier="dynamic" resourceType="ride_gallery_item" value={photo} onChange={setPhoto} label="Gallery photo" />
            </Field>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <Field label="Video link" hint="YouTube or Google Drive share link">
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            </Field>
          </div>
        )}
        <div className="sm:col-span-2">
          <Field label="Caption" hint="Optional">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
            Add to gallery
          </Button>
        </div>
      </div>

      {query.isPending ? (
        <Skeleton shape="rect" className="h-40" />
      ) : query.isError ? (
        <ErrorState title="Couldn't load the gallery" onRetry={() => void query.refetch()} />
      ) : years.length === 0 ? (
        <EmptyState title="No items yet" body="Add the first photo or video above." />
      ) : (
        <div className="flex flex-col gap-5">
          {years.map((y) => (
            <div key={y}>
              <p className="m-0 mb-2 text-[12px] font-bold text-fg">{y}</p>
              <div className="flex flex-col gap-2">
                {(byYear.get(y) ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-line p-2.5">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-[12.5px] font-semibold text-fg">{item.caption ?? item.url}</p>
                      <p className="m-0 text-[11px] text-fg-3">{item.kind}</p>
                    </div>
                    <IconButton label="Remove" onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending}>
                      <Trash2 />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export function RideAdminPage() {
  useDocumentMeta({ title: 'RIDE admin' });
  const qc = useQueryClient();
  const delegationsQuery = useQuery({
    queryKey: DELEGATIONS_KEY,
    queryFn: () => fetchDelegations({ pageSize: 100 }),
  });
  const supportClubsQuery = useQuery({
    queryKey: SUPPORT_CLUBS_KEY,
    queryFn: () => fetchSupportClubs({ ryYear: currentRyYear(), pageSize: 200 }),
  });

  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<Delegation | null>(null);

  const invalidateDelegations = () => void qc.invalidateQueries({ queryKey: DELEGATIONS_KEY });

  const columns: Column<Delegation>[] = [
    {
      key: 'delegation',
      header: 'Delegation',
      cell: (d) => (
        <div>
          <p className="m-0 text-[13px] font-bold text-fg">
            {d.country} · {d.visitingDistrict}
          </p>
          <p className="m-0 text-[11px] text-fg-3">
            {formatDate(d.startsAt)} – {formatDate(d.endsAt)} · {d.headcount} delegate{d.headcount === 1 ? '' : 's'}
          </p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (d) => <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge> },
    {
      key: 'hosts',
      header: 'Hosts',
      cell: (d) => (d.hosts.length === 0 ? <span className="text-[12px] text-fg-3">Unassigned</span> : d.hosts.map((h) => h.club.shortName ?? h.club.name).join(', ')),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (d) => (
        <Button size="sm" variant="secondary" onClick={() => setAssigning(d)}>
          Assign hosts
        </Button>
      ),
    },
  ];

  return (
    <Container width="wide">
      <Section
        eyebrow="RIDE admin"
        title="Delegations"
        description="Add incoming delegations and assign the district clubs hosting each one."
        action={<Button onClick={() => setCreating(true)}>Add delegation</Button>}
      >
        {delegationsQuery.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : delegationsQuery.isError ? (
          <ErrorState title="Couldn't load delegations" onRetry={() => void delegationsQuery.refetch()} />
        ) : delegationsQuery.data.items.length === 0 ? (
          <EmptyState title="No delegations yet" body="Add the first incoming delegation above." />
        ) : (
          <Table columns={columns} rows={delegationsQuery.data.items} rowKey={(d) => d.id} empty="No delegations yet." />
        )}
      </Section>

      <GalleryAdminSection />

      <CreateDelegationModal open={creating} onClose={() => setCreating(false)} onCreated={invalidateDelegations} />
      <HostAssignmentDrawer
        delegation={assigning}
        supportClubs={supportClubsQuery.data?.items ?? []}
        onClose={() => setAssigning(null)}
        onSaved={invalidateDelegations}
      />
    </Container>
  );
}
