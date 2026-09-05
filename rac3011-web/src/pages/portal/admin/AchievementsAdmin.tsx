import { achievementsApi } from '@/lib/publicContent/api';
import type { Achievement } from '@/lib/publicContent/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { AssetUrlField } from './AssetUrlField';
import { PublicContentTable } from './PublicContentTable';

const TYPE_OPTIONS = [
  { value: 'chartered_club', label: 'Chartered club' },
  { value: 'award', label: 'Award' },
  { value: 'milestone', label: 'Milestone' },
];

export function AchievementsAdmin({ canWrite }: { canWrite: boolean }) {
  return (
    <PublicContentTable<Achievement>
      title="Achievement"
      queryKey="achievements-admin"
      crud={achievementsApi}
      orderable
      canWrite={canWrite}
      writableKeys={['type', 'title', 'clubId', 'date', 'certificateUrl', 'description']}
      emptyValues={{ type: 'milestone', title: '', date: new Date().toISOString().slice(0, 10) }}
      columns={[
        { key: 'title', header: 'Title', cell: (r) => r.title },
        { key: 'type', header: 'Type', cell: (r) => r.type },
        { key: 'date', header: 'Date', cell: (r) => r.date },
      ]}
      renderForm={({ values, setValues }) => (
        <div className="flex flex-col gap-4">
          <Field label="Title" required>
            <Input value={values.title ?? ''} onChange={(e) => setValues({ title: e.target.value })} />
          </Field>
          <Field label="Type" required>
            <Select
              options={TYPE_OPTIONS}
              value={values.type ?? 'milestone'}
              onChange={(e) => setValues({ type: e.target.value as Achievement['type'] })}
            />
          </Field>
          <Field label="Date" required>
            <Input type="date" value={values.date ?? ''} onChange={(e) => setValues({ date: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={values.description ?? ''}
              onChange={(e) => setValues({ description: e.target.value })}
            />
          </Field>
          <AssetUrlField
            label="Certificate"
            url={values.certificateUrl}
            onChange={(certificateUrl) => setValues({ certificateUrl })}
            resourceType="achievement_certificate"
          />
        </div>
      )}
    />
  );
}
