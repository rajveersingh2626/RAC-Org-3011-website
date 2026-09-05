import { districtTeamApi } from '@/lib/publicContent/api';
import type { DistrictTeamMember } from '@/lib/publicContent/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AssetUrlField } from './AssetUrlField';
import { PublicContentTable } from './PublicContentTable';

function currentRyYear(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

export function DistrictTeamAdmin({ canWrite }: { canWrite: boolean }) {
  return (
    <PublicContentTable<DistrictTeamMember>
      title="District team member"
      queryKey="district-team-admin"
      crud={districtTeamApi}
      orderable
      canWrite={canWrite}
      writableKeys={['name', 'designation', 'kind', 'ryYear', 'photoUrl', 'phone', 'email', 'bio', 'clubId']}
      emptyValues={{ name: '', designation: '', kind: 'dsc', ryYear: currentRyYear() }}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => r.name },
        { key: 'designation', header: 'Designation', cell: (r) => r.designation },
        { key: 'kind', header: 'Kind', cell: (r) => r.kind },
        { key: 'ryYear', header: 'RY', cell: (r) => r.ryYear, numeric: true },
      ]}
      renderForm={({ values, setValues }) => (
        <div className="flex flex-col gap-4">
          <Field label="Name" required>
            <Input value={values.name ?? ''} onChange={(e) => setValues({ name: e.target.value })} />
          </Field>
          <Field label="Designation" required>
            <Input value={values.designation ?? ''} onChange={(e) => setValues({ designation: e.target.value })} />
          </Field>
          <Field label="Kind" required>
            <Select
              options={[
                { value: 'core', label: 'Core (DG, DRR)' },
                { value: 'dsc', label: 'DSC / zonal' },
              ]}
              value={values.kind ?? 'dsc'}
              onChange={(e) => setValues({ kind: e.target.value as DistrictTeamMember['kind'] })}
            />
          </Field>
          <Field label="Rotary year" required>
            <Input
              type="number"
              value={values.ryYear ?? currentRyYear()}
              onChange={(e) => setValues({ ryYear: Number(e.target.value) })}
            />
          </Field>
          <Field label="Phone">
            <Input value={values.phone ?? ''} onChange={(e) => setValues({ phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={values.email ?? ''} onChange={(e) => setValues({ email: e.target.value })} />
          </Field>
          <Field label="Bio">
            <Textarea rows={3} value={values.bio ?? ''} onChange={(e) => setValues({ bio: e.target.value })} />
          </Field>
          <AssetUrlField
            label="Portrait"
            url={values.photoUrl}
            onChange={(photoUrl) => setValues({ photoUrl })}
            resourceType="district_team_photo"
          />
        </div>
      )}
    />
  );
}
