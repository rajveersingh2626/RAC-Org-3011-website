import { sisterClubRequestsApi } from '@/lib/publicContent/api';
import type { SisterClubRequest } from '@/lib/publicContent/types';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PublicContentTable } from './PublicContentTable';

const STATUS_TONE: Record<string, 'neutral' | 'amber' | 'green' | 'red'> = {
  submitted: 'amber',
  in_progress: 'neutral',
  signed: 'green',
  declined: 'red',
};

export function SisterClubRequestsAdmin({ canWrite }: { canWrite: boolean }) {
  return (
    <PublicContentTable<SisterClubRequest>
      title="Sister-club request"
      queryKey="sister-club-requests-admin"
      crud={sisterClubRequestsApi}
      canWrite={canWrite}
      createKeys={['clubId', 'partnerClubName', 'partnerDistrict', 'country', 'contactName', 'contactEmail']}
      updateKeys={['status', 'signedOn']}
      emptyValues={{ clubId: '', partnerClubName: '', partnerDistrict: '', country: '', contactName: '', contactEmail: '' }}
      columns={[
        { key: 'partnerClubName', header: 'Partner club', cell: (r) => `${r.partnerClubName} (${r.partnerDistrict})` },
        { key: 'country', header: 'Country', cell: (r) => r.country },
        { key: 'status', header: 'Status', cell: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge> },
      ]}
      renderForm={({ values, setValues, isNew }) =>
        isNew ? (
          <div className="flex flex-col gap-4">
            <Field label="Requesting club id" required>
              <Input value={values.clubId ?? ''} onChange={(e) => setValues({ clubId: e.target.value })} />
            </Field>
            <Field label="Partner club name" required>
              <Input value={values.partnerClubName ?? ''} onChange={(e) => setValues({ partnerClubName: e.target.value })} />
            </Field>
            <Field label="Partner district" required>
              <Input value={values.partnerDistrict ?? ''} onChange={(e) => setValues({ partnerDistrict: e.target.value })} />
            </Field>
            <Field label="Country" required>
              <Input value={values.country ?? ''} onChange={(e) => setValues({ country: e.target.value })} />
            </Field>
            <Field label="Contact name" required>
              <Input value={values.contactName ?? ''} onChange={(e) => setValues({ contactName: e.target.value })} />
            </Field>
            <Field label="Contact email" required>
              <Input type="email" value={values.contactEmail ?? ''} onChange={(e) => setValues({ contactEmail: e.target.value })} />
            </Field>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-[13px] font-bold text-fg">
              {values.partnerClubName} · {values.partnerDistrict}, {values.country}
            </p>
            <Field label="Status">
              <Select
                options={[
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'in_progress', label: 'In progress' },
                  { value: 'signed', label: 'Signed' },
                  { value: 'declined', label: 'Declined' },
                ]}
                value={values.status ?? 'submitted'}
                onChange={(e) => setValues({ status: e.target.value })}
              />
            </Field>
            <Field label="Signed on">
              <Input
                type="date"
                value={values.signedOn ?? ''}
                onChange={(e) => setValues({ signedOn: e.target.value || null })}
              />
            </Field>
          </div>
        )
      }
    />
  );
}
