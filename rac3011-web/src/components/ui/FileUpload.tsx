import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { FileText, Link2, RotateCcw, Upload, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TIER_MAX_BYTES, TIER_MIME_TYPES, type StorageTier } from '@/lib/upload';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Input } from './Input';
import { ProgressBar } from './ProgressBar';
import { VisuallyHidden } from './VisuallyHidden';
import { useFileUpload, type FileUploadValue } from './useFileUpload';

export type { FileUploadValue };

export interface FileUploadProps {
  tier: StorageTier;
  resourceType: string;
  resourceId?: string;
  value?: FileUploadValue | null;
  onChange: (result: FileUploadValue | null) => void;
  label?: string;
  hint?: string;
  className?: string;
}

const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Number.isInteger(kb) ? kb.toFixed(0) : kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${Number.isInteger(mb) ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

function acceptedHint(tier: StorageTier): string {
  const types = TIER_MIME_TYPES[tier].map((m) => MIME_LABELS[m] ?? m).join(', ');
  return `Accepted: ${types} · up to ${formatBytes(TIER_MAX_BYTES[tier])}`;
}

export function FileUpload({ tier, resourceType, resourceId, value, onChange, label, hint, className }: FileUploadProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const [mode, setMode] = useState<'file' | 'link'>(value?.kind === 'link' ? 'link' : 'file');
  const [linkDraft, setLinkDraft] = useState(value?.kind === 'link' ? value.url : '');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { state, selectFile, cancel, retry, reset } = useFileUpload({ tier, resourceType, resourceId, onChange });

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void selectFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void selectFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onRemove = () => {
    reset();
    onChange(null);
  };

  const switchMode = (next: 'file' | 'link') => {
    reset();
    setMode(next);
  };

  const saveLink = () => {
    const url = linkDraft.trim();
    if (!url) return;
    onChange({ kind: 'link', url });
  };

  const removeLink = () => {
    setLinkDraft('');
    onChange(null);
  };

  const liveMessage = state.uploading
    ? `Uploading, ${Math.round(state.progress * 100)} percent complete`
    : state.error
      ? state.error
      : value?.kind === 'file'
        ? `Uploaded ${value.file.name}, ${formatBytes(value.file.size)}`
        : '';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label ? (
        <label htmlFor={inputId} className="text-[12px] font-bold leading-tight text-fg">
          {label}
        </label>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={TIER_MIME_TYPES[tier].join(',')}
        onChange={onInputChange}
        aria-describedby={state.error ? errorId : undefined}
        className="sr-only"
      />

      {mode === 'link' ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="url"
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              placeholder="https://drive.google.com/…"
              aria-label={label ?? 'Link URL'}
              className="flex-1"
            />
            <Button type="button" size="sm" onClick={saveLink} disabled={!linkDraft.trim()}>
              Save link
            </Button>
          </div>
          {value?.kind === 'link' ? (
            <div className="flex items-center justify-between gap-3 rounded-[12px] border border-line-accent bg-surface px-4 py-3">
              <span className="min-w-0 truncate text-[12.5px] text-fg-2">{value.url}</span>
              <IconButton label="Remove link" variant="ghost" onClick={removeLink}>
                <X aria-hidden />
              </IconButton>
            </div>
          ) : null}
          <p id={hintId} className="m-0 text-[11.5px] text-fg-3">
            {hint ?? 'Paste a Google Drive, Google Photos, or YouTube link.'}
          </p>
        </div>
      ) : state.uploading ? (
        <div className="rounded-[16px] border border-line-accent bg-surface px-5 py-5">
          <ProgressBar value={Math.round(state.progress * 100)} max={100} label="Uploading…" hint={`${Math.round(state.progress * 100)}%`} />
          <Button type="button" variant="ghost" size="sm" onClick={cancel} className="mt-3">
            Cancel
          </Button>
        </div>
      ) : value?.kind === 'file' ? (
        <div className="flex items-center justify-between gap-3 rounded-[16px] border border-line-accent bg-surface px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText aria-hidden className="size-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="m-0 truncate text-[13px] font-bold text-fg">{value.file.name}</p>
              <p className="m-0 text-[11.5px] text-fg-3">{formatBytes(value.file.size)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <IconButton label="Remove file" variant="ghost" onClick={onRemove}>
              <X aria-hidden />
            </IconButton>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          data-drag={dragOver || undefined}
          className={cn(
            'flex flex-col items-center gap-3 rounded-[16px] border-2 border-dashed px-5 py-8 text-center transition-colors',
            dragOver ? 'border-accent bg-accent-soft' : 'border-line',
            state.error && 'border-danger',
          )}
        >
          <Upload aria-hidden className="size-6 text-accent" />
          <p className="m-0 text-[13.5px] font-semibold text-fg">Drag a file here, or</p>
          <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          <p id={hintId} className="m-0 text-[11.5px] text-fg-3">
            {hint ?? acceptedHint(tier)}
          </p>
        </div>
      )}

      {state.error && mode === 'file' ? (
        <div id={errorId} role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-danger bg-accent-soft px-4 py-3">
          <p className="m-0 text-[12.5px] font-semibold text-danger-fg">{state.error}</p>
          <Button type="button" variant="secondary" size="sm" onClick={retry}>
            <RotateCcw aria-hidden className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      {!state.uploading ? (
        <Button type="button" variant="link" size="sm" onClick={() => switchMode(mode === 'file' ? 'link' : 'file')} className="self-start">
          <Link2 aria-hidden className="size-3.5" />
          {mode === 'file' ? 'Paste a link instead' : 'Upload a file instead'}
        </Button>
      ) : null}

      <VisuallyHidden as="p" aria-live="polite">
        {liveMessage}
      </VisuallyHidden>
    </div>
  );
}
