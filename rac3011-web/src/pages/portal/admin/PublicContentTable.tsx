import { type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { makeCrud } from '@/lib/publicContent/crud';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, type Column } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';

export interface PublicContentTableProps<T extends { id: string }> {
  title: string;
  queryKey: string;
  crud: ReturnType<typeof makeCrud<T>>;
  columns: Column<T>[];
  renderForm: (props: { values: Partial<T>; setValues: (patch: Partial<T>) => void; isNew: boolean }) => ReactNode;
  emptyValues: Partial<T>;
  /** Field keys the write endpoints accept; falls back to this for whichever of create/update isn't given (most entities share one shape - enquiries and sister-club-requests don't). */
  writableKeys?: (keyof T)[];
  createKeys?: (keyof T)[];
  updateKeys?: (keyof T)[];
  orderable?: boolean;
  canWrite: boolean;
}

function pick<T extends object>(values: Partial<T>, keys: (keyof T)[]): Partial<T> {
  const out: Partial<T> = {};
  for (const key of keys) if (key in values) out[key] = values[key];
  return out;
}

export function PublicContentTable<T extends { id: string }>({
  title,
  queryKey,
  crud,
  columns,
  renderForm,
  emptyValues,
  writableKeys,
  createKeys,
  updateKeys,
  orderable,
  canWrite,
}: PublicContentTableProps<T>) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: [queryKey], queryFn: crud.list });
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [values, setValuesState] = useState<Partial<T>>(emptyValues);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const isNew = editing === 'new';
      const keys = (isNew ? createKeys : updateKeys) ?? writableKeys ?? [];
      const payload = pick(values, keys);
      return !isNew && editing ? crud.update(editing.id, payload) : crud.create(payload);
    },
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
    onError: (err) => toast({ title: 'Could not save', body: (err as Error).message, tone: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crud.remove(id),
    onSuccess: () => {
      setConfirmDeleteId(null);
      invalidate();
    },
    onError: (err) => toast({ title: 'Could not delete', body: (err as Error).message, tone: 'error' }),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => crud.reorder(ids),
    onSuccess: () => invalidate(),
    onError: (err) => toast({ title: 'Could not reorder', body: (err as Error).message, tone: 'error' }),
  });

  function openCreate() {
    setValuesState(emptyValues);
    setEditing('new');
  }
  function openEdit(row: T) {
    setValuesState(row);
    setEditing(row);
  }
  function move(rowId: string, direction: -1 | 1) {
    const ids = (query.data ?? []).map((r) => r.id);
    const idx = ids.indexOf(rowId);
    const next = idx + direction;
    if (next < 0 || next >= ids.length) return;
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorderMutation.mutate(ids);
  }

  if (query.isPending) return <Skeleton shape="rect" className="h-72" />;
  if (query.isError) return <ErrorState title={`Couldn't load ${title.toLowerCase()}`} onRetry={() => void query.refetch()} />;

  const rows = query.data ?? [];
  const actionColumn: Column<T> = {
    key: '__actions',
    header: '',
    cell: (row) => (
      <div className="flex items-center justify-end gap-2">
        {orderable ? (
          <>
            <IconButton label="Move up" variant="ghost" onClick={() => move(row.id, -1)}>
              ↑
            </IconButton>
            <IconButton label="Move down" variant="ghost" onClick={() => move(row.id, 1)}>
              ↓
            </IconButton>
          </>
        ) : null}
        {canWrite ? (
          <>
            <Button variant="link" size="sm" onClick={() => openEdit(row)}>
              Edit
            </Button>
            <Button variant="link" size="sm" onClick={() => setConfirmDeleteId(row.id)}>
              Delete
            </Button>
          </>
        ) : null}
      </div>
    ),
    align: 'right',
  };

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex justify-end">
          <Button leading={<Plus size={16} />} onClick={openCreate}>
            New {title.toLowerCase()}
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} yet`} body="Nothing here yet." />
      ) : (
        <Table columns={[...columns, actionColumn]} rows={rows} rowKey={(r) => r.id} />
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `New ${title.toLowerCase()}` : `Edit ${title.toLowerCase()}`}
        size="lg"
        footer={
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Save
          </Button>
        }
      >
        {renderForm({
          values,
          setValues: (patch) => setValuesState((v) => ({ ...v, ...patch })),
          isNew: editing === 'new',
        })}
      </Modal>

      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete this row?"
        footer={
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}>
            Delete
          </Button>
        }
      >
        This cannot be undone.
      </Modal>
    </div>
  );
}
