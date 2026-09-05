import { FileUpload, type FileUploadValue } from '@/components/ui/FileUpload';
import type { StorageTier } from '@/lib/upload';

export interface AssetUrlFieldProps {
  label: string;
  url: string | null | undefined;
  onChange: (url: string | null) => void;
  resourceType: string;
  tier?: StorageTier;
}

export function AssetUrlField({ label, url, onChange, resourceType, tier = 'permanent' }: AssetUrlFieldProps) {
  const value: FileUploadValue | null = url ? { kind: 'link', url } : null;
  return (
    <FileUpload
      label={label}
      tier={tier}
      resourceType={resourceType}
      value={value}
      onChange={(next) => onChange(next ? (next.kind === 'file' ? (next.file.url ?? null) : next.url) : null)}
    />
  );
}
