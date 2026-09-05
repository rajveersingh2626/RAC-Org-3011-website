import { partnersApi } from '@/lib/publicContent/api';
import type { Partner } from '@/lib/publicContent/types';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AssetUrlField } from './AssetUrlField';
import { PublicContentTable } from './PublicContentTable';

export function PartnersAdmin({ canWrite }: { canWrite: boolean }) {
  return (
    <PublicContentTable<Partner>
      title="Partner"
      queryKey="partners-admin"
      crud={partnersApi}
      orderable
      canWrite={canWrite}
      writableKeys={['name', 'logoUrl', 'tier', 'website', 'permissionStatus']}
      emptyValues={{ name: '', tier: 'year_partner', permissionStatus: 'pending' }}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => r.name },
        { key: 'tier', header: 'Tier', cell: (r) => r.tier },
        {
          key: 'permissionStatus',
          header: 'Consent',
          cell: (r) => <Badge tone={r.permissionStatus === 'granted' ? 'green' : 'amber'}>{r.permissionStatus}</Badge>,
        },
      ]}
      renderForm={({ values, setValues }) => (
        <div className="flex flex-col gap-4">
          <Field label="Name" required>
            <Input value={values.name ?? ''} onChange={(e) => setValues({ name: e.target.value })} />
          </Field>
          <Field label="Tier" required>
            <Input
              value={values.tier ?? ''}
              onChange={(e) => setValues({ tier: e.target.value })}
              placeholder="year_partner, project_partner…"
            />
          </Field>
          <Field label="Website">
            <Input
              type="url"
              value={values.website ?? ''}
              onChange={(e) => setValues({ website: e.target.value })}
            />
          </Field>
          <Field label="Consent status" hint="A logo only renders publicly once consent is granted.">
            <Select
              options={[
                { value: 'pending', label: 'Pending consent' },
                { value: 'granted', label: 'Granted' },
              ]}
              value={values.permissionStatus ?? 'pending'}
              onChange={(e) => setValues({ permissionStatus: e.target.value as Partner['permissionStatus'] })}
            />
          </Field>
          <AssetUrlField
            label="Logo"
            url={values.logoUrl}
            onChange={(logoUrl) => setValues({ logoUrl })}
            resourceType="partner_logo"
          />
        </div>
      )}
    />
  );
}
