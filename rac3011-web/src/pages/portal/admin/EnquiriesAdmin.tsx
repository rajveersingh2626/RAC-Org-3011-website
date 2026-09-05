import { enquiriesApi } from '@/lib/publicContent/api';
import type { Enquiry } from '@/lib/publicContent/types';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PublicContentTable } from './PublicContentTable';

const STATUS_TONE: Record<string, 'neutral' | 'amber' | 'green'> = {
  new: 'amber',
  in_progress: 'neutral',
  closed: 'green',
};

export function EnquiriesAdmin({ canWrite }: { canWrite: boolean }) {
  return (
    <PublicContentTable<Enquiry>
      title="Enquiry"
      queryKey="enquiries-admin"
      crud={enquiriesApi}
      canWrite={canWrite}
      createKeys={['kind', 'name', 'email', 'phone', 'organisation', 'message', 'routedTo']}
      updateKeys={['status', 'assignedToId']}
      emptyValues={{ kind: 'contact', name: '', email: '', message: '', routedTo: '' }}
      columns={[
        { key: 'name', header: 'From', cell: (r) => `${r.name} · ${r.email}` },
        { key: 'kind', header: 'Kind', cell: (r) => r.kind },
        { key: 'status', header: 'Status', cell: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge> },
      ]}
      renderForm={({ values, setValues, isNew }) => (
        <div className="flex flex-col gap-4">
          {isNew ? (
            <>
              <Field label="Kind" required>
                <Select
                  options={[
                    { value: 'new_club', label: 'New club' },
                    { value: 'sponsor', label: 'Sponsor' },
                    { value: 'contact', label: 'Contact' },
                  ]}
                  value={values.kind ?? 'contact'}
                  onChange={(e) => setValues({ kind: e.target.value as Enquiry['kind'] })}
                />
              </Field>
              <Field label="Name" required>
                <Input value={values.name ?? ''} onChange={(e) => setValues({ name: e.target.value })} />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={values.email ?? ''} onChange={(e) => setValues({ email: e.target.value })} />
              </Field>
              <Field label="Message" required>
                <Textarea rows={3} value={values.message ?? ''} onChange={(e) => setValues({ message: e.target.value })} />
              </Field>
              <Field label="Routed to" required hint="Email address of the person who handled this.">
                <Input value={values.routedTo ?? ''} onChange={(e) => setValues({ routedTo: e.target.value })} />
              </Field>
            </>
          ) : (
            <>
              <p className="m-0 text-[13px] font-bold text-fg">{values.name}</p>
              <p className="m-0 text-[12.5px] text-fg-2">{values.message}</p>
              <Field label="Status">
                <Select
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'in_progress', label: 'In progress' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                  value={values.status ?? 'new'}
                  onChange={(e) => setValues({ status: e.target.value })}
                />
              </Field>
              <Field label="Assigned to (user id)">
                <Input
                  value={values.assignedToId ?? ''}
                  onChange={(e) => setValues({ assignedToId: e.target.value || null })}
                />
              </Field>
            </>
          )}
        </div>
      )}
    />
  );
}
