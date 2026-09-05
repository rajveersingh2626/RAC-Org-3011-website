import { FileUpload, type FileUploadValue } from '@/components/ui/FileUpload';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

function urlOf(v: FileUploadValue | null): string | null {
  if (!v) return null;
  if (v.kind === 'link') return v.url;
  return v.file.url;
}

export interface LinkFieldControlProps {
  multiple: boolean;
  value: unknown;
  onChange: (value: string | string[]) => void;
  label: string;
  disabled?: boolean;
}

export function LinkFieldControl({ multiple, value, onChange, label, disabled }: LinkFieldControlProps) {
  if (!multiple) {
    const current: FileUploadValue | null = typeof value === 'string' && value ? { kind: 'link', url: value } : null;
    return (
      <FileUpload
        tier="dynamic"
        resourceType="report_activity_photo"
        label={label}
        value={current}
        onChange={(v) => onChange(urlOf(v) ?? '')}
        hint="Upload a photo, or paste a Drive/Photos link."
      />
    );
  }

  const urls = Array.isArray(value) ? (value as string[]) : [];

  const addSlotChange = (v: FileUploadValue | null) => {
    const url = urlOf(v);
    if (url) onChange([...urls, url]);
  };

  return (
    <div className="flex flex-col gap-3">
      {urls.map((url, i) => (
        <div key={`${url}-${i}`} className="flex items-center gap-2 rounded-[12px] border border-line-accent bg-surface px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg-2">{url}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
          >
            <X aria-hidden className="size-3.5" />
            Remove
          </Button>
        </div>
      ))}
      {!disabled && (
        <FileUpload
          key={urls.length}
          tier="dynamic"
          resourceType="report_activity_photo"
          label={label}
          value={null}
          onChange={addSlotChange}
          hint="Add another photo or link."
        />
      )}
    </div>
  );
}
