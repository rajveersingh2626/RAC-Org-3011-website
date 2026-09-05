import { publicationsApi } from '@/lib/publicContent/api';
import type { Publication } from '@/lib/publicContent/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AssetUrlField } from './AssetUrlField';
import { PublicContentTable } from './PublicContentTable';

export function PublicationsAdmin({ canWrite }: { canWrite: boolean }) {
  return (
    <PublicContentTable<Publication>
      title="Publication"
      queryKey="publications-admin"
      crud={publicationsApi}
      canWrite={canWrite}
      writableKeys={['title', 'type', 'url', 'month', 'coverUrl']}
      emptyValues={{ title: '', type: 'newsletter', url: '', month: new Date().toISOString().slice(0, 7) }}
      columns={[
        { key: 'title', header: 'Title', cell: (r) => r.title },
        { key: 'type', header: 'Type', cell: (r) => r.type },
        { key: 'month', header: 'Month', cell: (r) => r.month },
      ]}
      renderForm={({ values, setValues }) => (
        <div className="flex flex-col gap-4">
          <Field label="Title" required>
            <Input value={values.title ?? ''} onChange={(e) => setValues({ title: e.target.value })} />
          </Field>
          <Field label="Type" required>
            <Select
              options={[
                { value: 'newsletter', label: 'Newsletter' },
                { value: 'directory', label: 'Directory' },
              ]}
              value={values.type ?? 'newsletter'}
              onChange={(e) => setValues({ type: e.target.value as Publication['type'] })}
            />
          </Field>
          <Field label="Month" required>
            <Input type="month" value={values.month ?? ''} onChange={(e) => setValues({ month: e.target.value })} />
          </Field>
          <AssetUrlField
            label="Document"
            url={values.url}
            onChange={(url) => setValues({ url: url ?? '' })}
            resourceType="publication_cover"
          />
          <AssetUrlField
            label="Cover image"
            url={values.coverUrl}
            onChange={(coverUrl) => setValues({ coverUrl })}
            resourceType="publication_cover"
          />
        </div>
      )}
    />
  );
}
