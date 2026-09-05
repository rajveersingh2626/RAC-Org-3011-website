import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchContentBlock } from '@/lib/content/api';
import { assetUrlOf, type ContentBlock, type ContentBlockType } from '@/lib/content/types';
import { useAuth } from '@/app/auth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FileUpload, type FileUploadValue } from '@/components/ui/FileUpload';
import { InlineStatus } from '@/components/ui/InlineStatus';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';

function toFileUploadValue(type: ContentBlockType, value: unknown): FileUploadValue | null {
  const url = assetUrlOf(type, value);
  return url ? { kind: 'link', url } : null;
}

export function ContentBlockEditor({ block }: { block: ContentBlock }) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { toast } = useToast();
  const isAsset = block.type === 'image' || block.type === 'link';
  const [text, setText] = useState(() => (isAsset ? '' : stringifyValue(block.draftValue)));
  const [asset, setAsset] = useState<FileUploadValue | null>(() => toFileUploadValue(block.type, block.draftValue));
  const [linkStatus, setLinkStatus] = useState(block.linkStatus);

  useEffect(() => {
    if (!isAsset) setText(stringifyValue(block.draftValue));
    else setAsset(toFileUploadValue(block.type, block.draftValue));
    setLinkStatus(block.linkStatus);
  }, [block, isAsset]);

  const saveMutation = useMutation({
    mutationFn: (input: { draftValue?: unknown; publish?: boolean }) =>
      patchContentBlock(block.pageKey, block.sectionKey, input),
    onSuccess: (updated) => {
      setLinkStatus(updated.linkStatus);
      void qc.invalidateQueries({ queryKey: ['content-blocks'] });
    },
    onError: (err) => toast({ title: 'Could not save', body: (err as Error).message, tone: 'error' }),
  });

  function draftValueFromForm(): unknown {
    if (block.type === 'image' || block.type === 'link') {
      if (!asset) return null;
      const url = asset.kind === 'file' ? (asset.file.url ?? '') : asset.url;
      return { url };
    }
    if (block.type === 'list') {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        toast({ title: 'Not valid JSON', tone: 'error' });
        return undefined;
      }
    }
    return text;
  }

  const saveDraft = () => {
    const draftValue = draftValueFromForm();
    if (draftValue === undefined) return;
    saveMutation.mutate({ draftValue });
  };

  const publish = () => {
    const draftValue = draftValueFromForm();
    if (draftValue === undefined) return;
    saveMutation.mutate({ draftValue, publish: true });
  };

  const canPublish = can('content:publish');
  const isPublished = block.publishedAt !== null;

  return (
    <div className="flex flex-col gap-3 border-b border-line py-4 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="m-0 text-[13px] font-bold text-fg">{block.sectionKey.replace(/_/g, ' ')}</p>
          <p className="m-0 text-[11px] text-fg-3">{block.type}</p>
        </div>
        <Badge tone={isPublished ? 'green' : 'amber'}>{isPublished ? 'Published' : 'Draft only'}</Badge>
      </div>

      {isAsset ? (
        <div className="flex flex-col gap-2">
          <FileUpload
            tier="permanent"
            resourceType="content_block"
            resourceId={`${block.pageKey}:${block.sectionKey}`}
            value={asset}
            onChange={setAsset}
          />
          {linkStatus ? <InlineStatus state={linkStatus} /> : null}
        </div>
      ) : (
        <Textarea
          rows={block.type === 'richtext' || block.type === 'list' ? 6 : 2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={block.sectionKey}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" loading={saveMutation.isPending} onClick={saveDraft}>
          Save draft
        </Button>
        {canPublish ? (
          <Button size="sm" loading={saveMutation.isPending} onClick={publish}>
            Publish
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return JSON.stringify(value, null, 2);
}
