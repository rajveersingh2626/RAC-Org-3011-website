import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { ApiError } from '@/lib/api';
import {
  commitMemberImport,
  fetchMembers,
  previewMemberImport,
  updateMemberStatus,
} from '@/lib/members/api';
import type { ImportPreviewRow, Member } from '@/lib/members/types';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

const STATUS_TONE: Record<string, BadgeTone> = { pending: 'amber', approved: 'green', suspended: 'red' };

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function RejectModal({
  memberId,
  onClose,
  onDone,
}: {
  memberId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const mutation = useMutation({
    mutationFn: () => updateMemberStatus(memberId as string, { status: 'suspended', rejectionReason: reason }),
    onSuccess: () => {
      setReason('');
      onDone();
    },
  });
  return (
    <Modal
      open={Boolean(memberId)}
      onClose={onClose}
      title="Not ours?"
      footer={
        <Button
          disabled={!reason.trim()}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Decline this account
        </Button>
      }
    >
      <Textarea
        rows={3}
        aria-label="Reason"
        placeholder="e.g. Signed up under the wrong club"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
}

function ImportModal({ clubId, open, onClose }: { clubId: string; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<{ id: string; rows: ImportPreviewRow[] } | null>(null);

  const previewMutation = useMutation({
    mutationFn: () => previewMemberImport(clubId, csv),
    onSuccess: (res) => setPreview({ id: res.id, rows: res.rows }),
  });

  const commitMutation = useMutation({
    mutationFn: () => {
      const rows = (preview?.rows ?? []).filter((r) => r.outcome === 'new');
      return commitMemberImport(preview!.id, clubId, rows);
    },
    onSuccess: (res) => {
      toast({ title: `Imported ${res.committed} member(s)`, tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['members'] });
      close();
    },
  });

  function close() {
    setCsv('');
    setPreview(null);
    onClose();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  }

  const newCount = (preview?.rows ?? []).filter((r) => r.outcome === 'new').length;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import a roster"
      footer={
        preview ? (
          <Button loading={commitMutation.isPending} disabled={newCount === 0} onClick={() => commitMutation.mutate()}>
            Add {newCount} member{newCount === 1 ? '' : 's'}
          </Button>
        ) : (
          <Button loading={previewMutation.isPending} disabled={!csv.trim()} onClick={() => previewMutation.mutate()}>
            Preview
          </Button>
        )
      }
    >
      {!preview ? (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[12.5px] text-fg-2">
            A CSV with columns <code>fullName, email, phone, rotaryId</code>. Email is the dedup key &ndash; a row
            matching an existing member is skipped, not duplicated.
          </p>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={(e) => void onFile(e)} />
          <Textarea
            rows={6}
            aria-label="CSV contents"
            placeholder="fullName,email,phone,rotaryId"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[12.5px] text-fg-2">
            {preview.rows.length} rows &middot; {newCount} new &middot;{' '}
            {preview.rows.filter((r) => r.outcome === 'duplicate').length} duplicate &middot;{' '}
            {preview.rows.filter((r) => r.outcome === 'invalid').length} invalid
          </p>
          <ul className="m-0 max-h-64 list-none overflow-y-auto p-0">
            {preview.rows.map((r) => (
              <li key={r.lineNumber} className="flex items-center justify-between gap-2 border-b border-line py-1.5 text-[12px]">
                <span className="truncate text-fg">{r.fullName || r.email}</span>
                <Badge tone={r.outcome === 'new' ? 'green' : r.outcome === 'duplicate' ? 'neutral' : 'red'}>
                  {r.outcome}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

export function AdminMembersPage() {
  useDocumentMeta({ title: 'Members' });
  const { me } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const clubs = me?.clubs ?? [];
  const [clubId, setClubId] = useState(clubs[0]?.id ?? '');
  const [q, setQ] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const effectiveClubId = clubId || clubs[0]?.id || '';
  const membersQuery = useQuery({
    queryKey: ['members', effectiveClubId, q],
    queryFn: () => fetchMembers({ clubId: effectiveClubId || undefined, q: q || undefined, pageSize: 200 }),
    enabled: Boolean(effectiveClubId) || clubs.length === 0,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => updateMemberStatus(id, { status: 'approved' }),
    onSuccess: () => {
      toast({ title: 'Member approved', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (e) => toast({ title: e instanceof ApiError ? e.message : 'Could not approve', tone: 'error' }),
  });

  const suspendMutation = useMutation({
    mutationFn: (member: Member) =>
      updateMemberStatus(member.id, {
        status: member.status === 'suspended' ? 'approved' : 'suspended',
        rejectionReason: member.status === 'suspended' ? null : 'Suspended by club officer',
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['members'] }),
  });

  const items = useMemo(() => membersQuery.data?.items ?? [], [membersQuery.data]);
  const pending = useMemo(() => items.filter((m) => m.status === 'pending'), [items]);
  const roster = useMemo(() => items.filter((m) => m.status !== 'pending'), [items]);

  if (membersQuery.isError) {
    return (
      <Container>
        <ErrorState title="Couldn't load members" onRetry={() => void membersQuery.refetch()} />
      </Container>
    );
  }

  return (
    <Container width="wide">
      <Section
        eyebrow="An account is worth approving quickly"
        title="Members"
        description={`${roster.length} on the roster, ${pending.length} waiting for you.`}
      >
        {clubs.length > 1 && (
          <div className="mb-5 max-w-[260px]">
            <Select
              aria-label="Club"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              options={clubs.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        )}

        {membersQuery.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-6">
                <p className="m-0 mb-3 text-[10.5px] font-bold tracking-[1px] text-fg-3">
                  WAITING FOR APPROVAL · {pending.length}
                </p>
                <div className="flex flex-col gap-2.5">
                  {pending.map((m) => (
                    <Card key={m.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.fullName} size="md" />
                          <div>
                            <p className="m-0 text-[13px] font-bold text-fg">{m.fullName}</p>
                            <p className="m-0 text-[11.5px] text-fg-3">
                              {m.email} &middot; Signed up {timeAgo(m.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(m.id)}>
                            Approve
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setRejectingId(m.id)}>
                            Not ours
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-[10.5px] font-bold tracking-[1px] text-fg-3">ROSTER</p>
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Search the roster"
                  placeholder="Search the roster…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  Import a roster
                </Button>
              </div>
            </div>

            {roster.length === 0 ? (
              <EmptyState title="No members on the roster yet" />
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {roster.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-line-accent px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.fullName} src={m.photoUrl ?? undefined} size="md" />
                      <div>
                        <p className="m-0 text-[13px] font-bold text-fg">{m.fullName}</p>
                        <p className="m-0 text-[11.5px] text-fg-3">{[m.email, ...m.skills].join(' · ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[m.status]}>{m.status.toUpperCase()}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={suspendMutation.isPending}
                        onClick={() => suspendMutation.mutate(m)}
                      >
                        {m.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-fg-3">Showing {roster.length} of {membersQuery.data?.total ?? roster.length}</p>
          </>
        )}
      </Section>

      <RejectModal
        memberId={rejectingId}
        onClose={() => setRejectingId(null)}
        onDone={() => {
          setRejectingId(null);
          void qc.invalidateQueries({ queryKey: ['members'] });
        }}
      />
      <ImportModal clubId={effectiveClubId} open={importOpen} onClose={() => setImportOpen(false)} />
    </Container>
  );
}
