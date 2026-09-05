import { pastDrrsApi } from '@/lib/publicContent/api';
import type { PastDrr } from '@/lib/publicContent/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { TagInput } from '@/components/ui/TagInput';
import { Textarea } from '@/components/ui/Textarea';
import { AssetUrlField } from './AssetUrlField';
import { PublicContentTable } from './PublicContentTable';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function PastDrrsAdmin({ canWrite }: { canWrite: boolean }) {
  return (
    <PublicContentTable<PastDrr>
      title="Past DRR"
      queryKey="past-drrs-admin"
      crud={pastDrrsApi}
      orderable
      canWrite={canWrite}
      writableKeys={['name', 'slug', 'terms', 'homeClubId', 'photoUrl', 'bio', 'isLowResPhoto']}
      emptyValues={{ name: '', slug: '', terms: [], isLowResPhoto: false }}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => r.name },
        { key: 'terms', header: 'Terms', cell: (r) => r.terms.join(', ') },
      ]}
      renderForm={({ values, setValues }) => (
        <div className="flex flex-col gap-4">
          <Field label="Name" required>
            <Input
              value={values.name ?? ''}
              onChange={(e) => setValues({ name: e.target.value, slug: values.slug || slugify(e.target.value) })}
            />
          </Field>
          <Field label="Slug" required hint="Used in the public URL.">
            <Input value={values.slug ?? ''} onChange={(e) => setValues({ slug: e.target.value })} />
          </Field>
          <Field label="Terms" hint="e.g. 2019-20, then Enter">
            <TagInput values={values.terms ?? []} onChange={(terms) => setValues({ terms })} />
          </Field>
          <Field label="Bio">
            <Textarea rows={3} value={values.bio ?? ''} onChange={(e) => setValues({ bio: e.target.value })} />
          </Field>
          <AssetUrlField
            label="Portrait"
            url={values.photoUrl}
            onChange={(photoUrl) => setValues({ photoUrl })}
            resourceType="past_drr_photo"
          />
          <Switch
            checked={values.isLowResPhoto ?? false}
            onChange={(isLowResPhoto) => setValues({ isLowResPhoto })}
            label="Photo is low resolution"
            description="Renders at a fixed small size instead of being upscaled."
          />
        </div>
      )}
    />
  );
}
