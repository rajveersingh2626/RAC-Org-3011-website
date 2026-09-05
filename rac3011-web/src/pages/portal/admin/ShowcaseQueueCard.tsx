import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { updateProject } from '@/lib/showcase/api';
import type { Project } from '@/lib/showcase/types';
import { ApiError } from '@/lib/api';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function looksRough(text: string): boolean {
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

export interface ShowcaseQueueCardProps {
  project: Project;
  queryKey: unknown[];
}

export function ShowcaseQueueCard({ project, queryKey }: ShowcaseQueueCardProps) {
  const qc = useQueryClient();
  const [publishedTitle, setPublishedTitle] = useState(project.publishedTitle ?? project.title);
  const [publishedSummary, setPublishedSummary] = useState(project.publishedSummary ?? project.summary);
  const [holding, setHolding] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey });

  const publishMutation = useMutation({
    mutationFn: () =>
      updateProject(project.id, {
        publishedTitle: publishedTitle.trim(),
        publishedSummary: publishedSummary.trim(),
        status: 'published',
      }),
    onSuccess: invalidate,
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not publish this project.'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => updateProject(project.id, { status: 'rejected', rejectionReason: reason.trim() }),
    onSuccess: () => {
      setHolding(false);
      invalidate();
    },
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not hold this project.'),
  });

  const lead = project.clubs.find((c) => c.role === 'lead')?.club;
  const collaborators = project.clubs.filter((c) => c.role === 'collaborator').length;
  const rough = looksRough(project.summary);
  const photo = project.photos[0];

  return (
    <div className="grid grid-cols-1 gap-5 rounded-[14px] border border-line-accent p-5 sm:grid-cols-[180px_1fr_260px]">
      <div className="aspect-[4/3] overflow-hidden rounded-[10px] bg-page">
        {photo ? (
          <img src={photo} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-[11px] text-fg-3">No photo</div>
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="pink">{project.category.toUpperCase()}</Badge>
          <span className="text-[11.5px] text-fg-3">
            {lead?.name ?? 'Unknown club'} · {formatDate(project.date)}
          </span>
        </div>
        <p className="m-0 mb-2 text-[16px] font-extrabold text-fg">{project.title}</p>

        {error && (
          <div className="mb-2">
            <Alert tone="error" title="Something went wrong">
              {error}
            </Alert>
          </div>
        )}

        <div className={rough ? 'rounded-[8px] border border-danger bg-accent-soft p-3' : 'rounded-[8px] border border-line-accent bg-page p-3'}>
          <p className={rough ? 'm-0 mb-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-danger-fg' : 'm-0 mb-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-fg-3'}>
            {rough ? 'Needs a rewrite before publishing' : 'Summary — editable before publishing'}
          </p>
          <p className="m-0 mb-2 text-[12.5px] italic text-fg-3">Submitted verbatim: “{project.summary}”</p>
          <Input value={publishedTitle} onChange={(e) => setPublishedTitle(e.target.value)} className="mb-2" aria-label="Published title" />
          <Textarea value={publishedSummary} onChange={(e) => setPublishedSummary(e.target.value)} rows={3} aria-label="Published summary" />
        </div>
      </div>

      <div>
        <div className="mb-3.5 flex flex-col gap-2 text-[12px]">
          <div className="flex justify-between">
            <span className="text-fg-3">Reached</span>
            <span className="font-bold text-fg">{project.beneficiaries ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-3">Collaborators</span>
            <span className="font-bold text-fg">{collaborators} listed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-3">Consent confirmed</span>
            <span className="font-bold text-fg">{project.consentConfirmed ? 'Yes' : 'No'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
            disabled={!publishedTitle.trim() || !publishedSummary.trim()}
          >
            Publish
          </Button>
          <Button variant="secondary" onClick={() => setHolding(true)}>
            Hold
          </Button>
        </div>
      </div>

      <Modal
        open={holding}
        onClose={() => setHolding(false)}
        title="Hold this submission back"
        footer={
          <Button disabled={!reason.trim()} loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
            Hold with this reason
          </Button>
        }
      >
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="What does the club need to fix before this can be published?"
          aria-label="Reason"
        />
      </Modal>
    </div>
  );
}
