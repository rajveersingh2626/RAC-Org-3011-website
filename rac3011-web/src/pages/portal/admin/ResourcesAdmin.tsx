import { resourcesApi } from '@/lib/publicContent/api';
import { RESOURCE_CATEGORIES, type Resource } from '@/lib/publicContent/types';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { AssetUrlField } from './AssetUrlField';
import { PublicContentTable } from './PublicContentTable';

export function ResourcesAdmin({ canWrite }: { canWrite: boolean }) {
  return (
    <PublicContentTable<Resource>
      title="Resource"
      queryKey="resources-admin"
      crud={resourcesApi}
      orderable
      canWrite={canWrite}
      writableKeys={['category', 'title', 'description', 'url', 'isLocked', 'requiredPermission', 'comingSoonMonth']}
      emptyValues={{ category: 'documents', title: '', url: '', isLocked: false }}
      columns={[
        { key: 'title', header: 'Title', cell: (r) => r.title },
        { key: 'category', header: 'Category', cell: (r) => r.category },
        {
          key: 'state',
          header: 'State',
          cell: (r) =>
            r.isLocked ? (
              <Badge tone="amber">Locked</Badge>
            ) : r.comingSoonMonth ? (
              <Badge tone="blue">Coming {r.comingSoonMonth}</Badge>
            ) : (
              <Badge tone="green">Live</Badge>
            ),
        },
      ]}
      renderForm={({ values, setValues }) => (
        <div className="flex flex-col gap-4">
          <Field label="Title" required>
            <Input value={values.title ?? ''} onChange={(e) => setValues({ title: e.target.value })} />
          </Field>
          <Field label="Category" required>
            <Select
              options={RESOURCE_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
              value={values.category ?? 'documents'}
              onChange={(e) => setValues({ category: e.target.value as Resource['category'] })}
            />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={values.description ?? ''} onChange={(e) => setValues({ description: e.target.value })} />
          </Field>
          <AssetUrlField
            label="Document"
            url={values.url}
            onChange={(url) => setValues({ url: url ?? '' })}
            tier="private"
            resourceType="resource_document"
          />
          <Switch
            checked={values.isLocked ?? false}
            onChange={(isLocked) => setValues({ isLocked })}
            label="Locked (requires sign-in)"
          />
          {values.isLocked ? (
            <Field label="Required permission" hint="e.g. members:view">
              <Input
                value={values.requiredPermission ?? ''}
                onChange={(e) => setValues({ requiredPermission: e.target.value })}
              />
            </Field>
          ) : null}
          <Field label="Coming-soon month" hint="Leave blank if the resource is already live.">
            <Input
              value={values.comingSoonMonth ?? ''}
              onChange={(e) => setValues({ comingSoonMonth: e.target.value || null })}
              placeholder="November 2026"
            />
          </Field>
        </div>
      )}
    />
  );
}
