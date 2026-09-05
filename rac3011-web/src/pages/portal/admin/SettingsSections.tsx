import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSettings, type SettingsMap } from '@/lib/settings/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { TagInput } from '@/components/ui/TagInput';
import { useToast } from '@/components/ui/Toast';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}
function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
function numArr(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : [];
}

function useSaveSection(sectionLabel: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (patch: SettingsMap) => updateSettings(patch),
    onSuccess: () => {
      toast({ title: `${sectionLabel} saved`, tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast({ title: `Couldn't save ${sectionLabel}`, body: (err as Error).message, tone: 'error' }),
  });
}

export function ReportingSection({ settings }: { settings: SettingsMap }) {
  const [deadlineDay, setDeadlineDay] = useState(num(settings['report.deadlineDay'], 5));
  const [thresholdMonths, setThresholdMonths] = useState(num(settings['compliance.thresholdMonths'], 2));
  const [allowAnonymous, setAllowAnonymous] = useState(bool(settings['feedback.allowAnonymous']));
  const save = useSaveSection('Reporting & compliance');

  return (
    <Card eyebrow="Reporting" title="Reporting & compliance">
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Report deadline day of month">
          <Input type="number" min={1} max={28} value={deadlineDay} onChange={(e) => setDeadlineDay(Number(e.target.value))} />
        </Field>
        <Field label="Compliance threshold (months)">
          <Input type="number" min={1} max={12} value={thresholdMonths} onChange={(e) => setThresholdMonths(Number(e.target.value))} />
        </Field>
      </div>
      <Switch
        className="mt-4"
        checked={allowAnonymous}
        onChange={setAllowAnonymous}
        label="Allow anonymous feedback"
      />
      <Button
        className="mt-4"
        size="sm"
        loading={save.isPending}
        onClick={() =>
          save.mutate({
            'report.deadlineDay': deadlineDay,
            'compliance.thresholdMonths': thresholdMonths,
            'feedback.allowAnonymous': allowAnonymous,
          })
        }
      >
        Save
      </Button>
    </Card>
  );
}

export function DrrCalendarSection({ settings }: { settings: SettingsMap }) {
  const [workingDays, setWorkingDays] = useState<number[]>(numArr(settings['drr.workingDays']));
  const [dayStart, setDayStart] = useState(str(settings['drr.dayStart'], '10:00'));
  const [dayEnd, setDayEnd] = useState(str(settings['drr.dayEnd'], '19:00'));
  const [slotMinutes, setSlotMinutes] = useState(num(settings['drr.slotMinutes'], 60));
  const [bufferMinutes, setBufferMinutes] = useState(num(settings['drr.bufferMinutes'], 30));
  const [monthsAhead, setMonthsAhead] = useState(num(settings['drr.monthsAhead'], 9));
  const [blackoutDates, setBlackoutDates] = useState<string[]>(arr(settings['drr.blackoutDates']));
  const save = useSaveSection('DRR calendar');

  const toggleDay = (day: number) => {
    setWorkingDays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()));
  };

  return (
    <Card eyebrow="DRR calendar" title="DRR availability">
      <p className="m-0 mb-3 text-[12px] font-bold text-fg">Working days</p>
      <div className="flex flex-wrap gap-2">
        {DAY_LABELS.map((label, day) => (
          <button
            key={label}
            type="button"
            onClick={() => toggleDay(day)}
            data-active={workingDays.includes(day) || undefined}
            className="min-h-11 rounded-[8px] border border-line-accent px-3 text-[12.5px] font-semibold text-fg-2 data-[active]:border-accent data-[active]:bg-accent-soft data-[active]:text-accent"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Day start"><Input value={dayStart} onChange={(e) => setDayStart(e.target.value)} placeholder="10:00" /></Field>
        <Field label="Day end"><Input value={dayEnd} onChange={(e) => setDayEnd(e.target.value)} placeholder="19:00" /></Field>
        <Field label="Slot minutes"><Input type="number" value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} /></Field>
        <Field label="Buffer minutes"><Input type="number" value={bufferMinutes} onChange={(e) => setBufferMinutes(Number(e.target.value))} /></Field>
      </div>
      <Field className="mt-4" label="Months ahead to open">
        <Input type="number" value={monthsAhead} onChange={(e) => setMonthsAhead(Number(e.target.value))} />
      </Field>
      <Field className="mt-4" label="Blackout dates">
        <TagInput values={blackoutDates} onChange={setBlackoutDates} placeholder="YYYY-MM-DD, then Enter" />
      </Field>
      <Button
        className="mt-4"
        size="sm"
        loading={save.isPending}
        onClick={() =>
          save.mutate({
            'drr.workingDays': workingDays,
            'drr.dayStart': dayStart,
            'drr.dayEnd': dayEnd,
            'drr.slotMinutes': slotMinutes,
            'drr.bufferMinutes': bufferMinutes,
            'drr.monthsAhead': monthsAhead,
            'drr.blackoutDates': blackoutDates,
          })
        }
      >
        Save
      </Button>
    </Card>
  );
}

export function RclCareerbridgeSection({ settings }: { settings: SettingsMap }) {
  const [pointsWin, setPointsWin] = useState(num(settings['rcl.pointsWin'], 2));
  const [pointsTie, setPointsTie] = useState(num(settings['rcl.pointsTie'], 1));
  const [season, setSeason] = useState(num(settings['rcl.season'], 2026));
  const [expiryDays, setExpiryDays] = useState(num(settings['careerbridge.expiryDays'], 45));
  const save = useSaveSection('RCL & Career Bridge');

  return (
    <Card eyebrow="RCL & Career Bridge" title="League scoring and listing expiry">
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="RCL points — win"><Input type="number" value={pointsWin} onChange={(e) => setPointsWin(Number(e.target.value))} /></Field>
        <Field label="RCL points — tie"><Input type="number" value={pointsTie} onChange={(e) => setPointsTie(Number(e.target.value))} /></Field>
        <Field label="RCL season"><Input type="number" value={season} onChange={(e) => setSeason(Number(e.target.value))} /></Field>
        <Field label="Career Bridge listing expiry (days)">
          <Input type="number" value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))} />
        </Field>
      </div>
      <Button
        className="mt-4"
        size="sm"
        loading={save.isPending}
        onClick={() =>
          save.mutate({
            'rcl.pointsWin': pointsWin,
            'rcl.pointsTie': pointsTie,
            'rcl.season': season,
            'careerbridge.expiryDays': expiryDays,
          })
        }
      >
        Save
      </Button>
    </Card>
  );
}

export function EnquiryRoutingSection({ settings }: { settings: SettingsMap }) {
  type Routing = { name: string; email: string };
  const initial = (settings.enquiry_routing ?? {}) as Record<string, Routing | undefined>;
  const [routing, setRouting] = useState<Record<'new_club' | 'sponsor' | 'contact', Routing>>({
    new_club: initial.new_club ?? { name: '', email: '' },
    sponsor: initial.sponsor ?? { name: '', email: '' },
    contact: initial.contact ?? { name: '', email: '' },
  });
  const save = useSaveSection('Enquiry routing');

  const labels: Record<keyof typeof routing, string> = {
    new_club: 'New club enquiries',
    sponsor: 'Sponsorship enquiries',
    contact: 'General contact',
  };

  return (
    <Card eyebrow="Get involved" title="Enquiry routing">
      <div className="mt-3 flex flex-col gap-4">
        {(Object.keys(routing) as (keyof typeof routing)[]).map((key) => (
          <div key={key} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={`${labels[key]} — name`}>
              <Input
                value={routing[key].name}
                onChange={(e) => setRouting((r) => ({ ...r, [key]: { ...r[key], name: e.target.value } }))}
              />
            </Field>
            <Field label={`${labels[key]} — email`}>
              <Input
                type="email"
                value={routing[key].email}
                onChange={(e) => setRouting((r) => ({ ...r, [key]: { ...r[key], email: e.target.value } }))}
              />
            </Field>
          </div>
        ))}
      </div>
      <Button className="mt-4" size="sm" loading={save.isPending} onClick={() => save.mutate({ enquiry_routing: routing })}>
        Save
      </Button>
    </Card>
  );
}
