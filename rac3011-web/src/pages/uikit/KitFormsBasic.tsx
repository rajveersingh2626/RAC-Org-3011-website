import { useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { DateInput } from '@/components/ui/DateInput';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/Radio';
import { RangeInput } from '@/components/ui/RangeInput';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

export function KitFormsBasic() {
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [role, setRole] = useState('member');
  const [agreed, setAgreed] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [tier, setTier] = useState('district');
  const [joinDate, setJoinDate] = useState('2026-07-01');
  const [budget, setBudget] = useState(35);

  return (
    <KitSection title="Forms — basics" description="Controlled inputs, selection controls, and the Field wrapper.">
      <KitGrid>
        <KitEntry name="Field + Input">
          <Field label="Club email" required hint="Used for report reminders">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="president@racddl.org" />
          </Field>
        </KitEntry>
        <KitEntry name="Field — error state">
          <Field label="Club email" required error="Enter a valid email address">
            <Input defaultValue="not-an-email" />
          </Field>
        </KitEntry>
        <KitEntry name="Textarea">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={120} placeholder="Notes for the district" />
        </KitEntry>
        <KitEntry name="Select">
          <Select
            aria-label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'member', label: 'Member' },
              { value: 'president', label: 'President' },
              { value: 'secretary', label: 'Secretary' },
            ]}
          />
        </KitEntry>
        <KitEntry name="Checkbox">
          <Checkbox label="I agree to the code of conduct" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        </KitEntry>
        <KitEntry name="Radio / RadioGroup">
          <RadioGroup
            legend="Reporting tier"
            name="tier"
            value={tier}
            onChange={setTier}
            options={[
              { value: 'district', label: 'District' },
              { value: 'zone', label: 'Zone' },
              { value: 'club', label: 'Club' },
            ]}
          />
        </KitEntry>
        <KitEntry name="Switch">
          <Switch checked={reminders} onChange={setReminders} label="Email reminders" description="Sent 3 days before deadline" />
        </KitEntry>
        <KitEntry name="DateInput">
          <DateInput value={joinDate} onChange={setJoinDate} aria-label="Join date" />
        </KitEntry>
        <KitEntry name="RangeInput">
          <RangeInput aria-label="Sponsorship budget" value={budget} onChange={setBudget} min={0} max={100} formatValue={(v) => `₹${v}k`} />
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
