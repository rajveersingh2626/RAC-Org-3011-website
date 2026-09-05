import { useCallback, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { uploadFile, validateFile, type StorageTier, type StoredFile } from '@/lib/upload';

export type FileUploadValue = { kind: 'file'; file: StoredFile } | { kind: 'link'; url: string };

export interface UseFileUploadInput {
  tier: StorageTier;
  resourceType: string;
  resourceId?: string;
  onChange: (result: FileUploadValue | null) => void;
}

export interface UseFileUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

const IDLE: UseFileUploadState = { uploading: false, progress: 0, error: null };

export function useFileUpload({ tier, resourceType, resourceId, onChange }: UseFileUploadInput) {
  const [state, setState] = useState<UseFileUploadState>(IDLE);
  const lastFileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runUpload = useCallback(
    async (file: File) => {
      lastFileRef.current = file;
      const problem = validateFile(file, tier);
      if (problem) {
        setState({ uploading: false, progress: 0, error: problem });
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ uploading: true, progress: 0, error: null });
      try {
        const stored = await uploadFile({
          file,
          tier,
          resourceType,
          resourceId,
          signal: controller.signal,
          onProgress: (fraction) => setState((s) => ({ ...s, progress: fraction })),
        });
        abortRef.current = null;
        setState(IDLE);
        onChange({ kind: 'file', file: stored });
      } catch (err) {
        abortRef.current = null;
        if (err instanceof DOMException && err.name === 'AbortError') {
          setState(IDLE);
          return;
        }
        const message = err instanceof ApiError ? err.message : 'Upload failed. Check your connection and retry.';
        setState({ uploading: false, progress: 0, error: message });
      }
    },
    [tier, resourceType, resourceId, onChange],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retry = useCallback(() => {
    if (lastFileRef.current) void runUpload(lastFileRef.current);
  }, [runUpload]);

  const reset = useCallback(() => {
    lastFileRef.current = null;
    setState(IDLE);
  }, []);

  return { state, selectFile: runUpload, cancel, retry, reset };
}
