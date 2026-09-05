import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { fetchMyProjects, deleteProject } from '@/lib/showcase/api';
import type { Project, ProjectStatus } from '@/lib/showcase/types';
import { EditShowcaseForm } from './EditShowcaseForm';

const STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'blue',
  published: 'green',
  rejected: 'red',
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  submitted: 'Awaiting review',
  published: 'Published',
  rejected: 'Held back',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MyShowcasePage() {
  useDocumentMeta({ title: 'My showcase posts' });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['projects', 'mine'], queryFn: () => fetchMyProjects({ pageSize: 100 }) });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects', 'mine'] }),
    onError: () => setDeleteError('Could not delete this draft. Try again.'),
  });

  const editing = query.data?.items.find((p) => p.id === editingId) ?? null;

  const columns: Column<Project>[] = [
    {
      key: 'title',
      header: 'Project',
      cell: (p) => (
        <div>
          <p className="m-0 text-[13px] font-bold text-fg">{p.title}</p>
          <p className="m-0 text-[11px] text-fg-3">
            {p.category} · {formatDate(p.date)}
          </p>
          {p.status === 'rejected' && p.rejectionReason ? (
            <p className="m-0 mt-1 max-w-[46ch] text-[11.5px] text-danger-fg">{p.rejectionReason}</p>
          ) : null}
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (p) => <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-3">
          {p.status === 'published' && p.slug ? (
            <Link to={`/showcase/${p.slug}`} className="font-bold text-accent">
              View live
            </Link>
          ) : null}
          {(p.status === 'draft' || p.status === 'rejected') && (
            <button type="button" className="font-bold text-accent" onClick={() => setEditingId(p.id)}>
              Edit
            </button>
          )}
          {p.status === 'draft' && (
            <button
              type="button"
              className="font-bold text-danger-fg"
              onClick={() => window.confirm(`Delete "${p.title}"?`) && deleteMutation.mutate(p.id)}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Container>
      <Section
        eyebrow="What you've written up"
        title="My showcase posts"
        description="Drafts, ones waiting on an officer, and what's already live."
        action={<Button onClick={() => navigate('/portal/showcase/submit')}>Put a project on the showcase</Button>}
      >
        {deleteError && (
          <div className="mb-5">
            <Alert tone="error" title="Couldn't delete">
              {deleteError}
            </Alert>
          </div>
        )}

        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load your showcase posts" onRetry={() => void query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="Nothing submitted yet"
            body="Ran a project worth showing off? Write it up and an officer will publish it."
            action={<Button onClick={() => navigate('/portal/showcase/submit')}>Put a project on the showcase</Button>}
          />
        ) : (
          <Table columns={columns} rows={query.data.items} rowKey={(p) => p.id} empty="Nothing here yet." />
        )}
      </Section>

      <Modal open={Boolean(editing)} onClose={() => setEditingId(null)} title="Edit your submission" size="lg">
        {editing ? (
          <EditShowcaseForm
            project={editing}
            onDone={() => {
              setEditingId(null);
              void qc.invalidateQueries({ queryKey: ['projects', 'mine'] });
            }}
          />
        ) : null}
      </Modal>
    </Container>
  );
}
