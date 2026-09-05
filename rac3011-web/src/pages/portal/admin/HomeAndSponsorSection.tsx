import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSettings, type SettingsMap } from '@/lib/settings/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}
function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function HomeAndSponsorSection({ settings }: { settings: SettingsMap }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const homeStats = (settings['home.stats'] ?? {}) as Record<string, unknown>;
  const sponsorRatios = (settings['sponsor.ratios'] ?? {}) as Record<string, unknown>;

  const [zones, setZones] = useState(num(homeStats.zones, 4));
  const [focusAreas, setFocusAreas] = useState(num(homeStats.focusAreas, 7));
  const [foundedYear, setFoundedYear] = useState(num(homeStats.foundedYear, 1968));
  const [ageRange, setAgeRange] = useState(str(homeStats.ageRange, '18–30'));

  const [perRupee, setPerRupee] = useState(num(sponsorRatios.perRupee, 1));
  const [mealsPerThousand, setMealsPerThousand] = useState(num(sponsorRatios.mealsPerThousand, 40));
  const [kitsPerThousand, setKitsPerThousand] = useState(num(sponsorRatios.kitsPerThousand, 8));
  const [unitsPerThousand, setUnitsPerThousand] = useState(num(sponsorRatios.unitsPerThousand, 2));

  const save = useMutation({
    mutationFn: (patch: SettingsMap) => updateSettings(patch),
    onSuccess: () => {
      toast({ title: 'Homepage stats & sponsor ratios saved', tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast({ title: 'Could not save', body: (err as Error).message, tone: 'error' }),
  });

  return (
    <Card eyebrow="Homepage & sponsorship" title="Home stats and sponsor ratios">
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Zones"><Input type="number" value={zones} onChange={(e) => setZones(Number(e.target.value))} /></Field>
        <Field label="Focus areas"><Input type="number" value={focusAreas} onChange={(e) => setFocusAreas(Number(e.target.value))} /></Field>
        <Field label="Founded year"><Input type="number" value={foundedYear} onChange={(e) => setFoundedYear(Number(e.target.value))} /></Field>
        <Field label="Age range"><Input value={ageRange} onChange={(e) => setAgeRange(e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="₹ per unit"><Input type="number" value={perRupee} onChange={(e) => setPerRupee(Number(e.target.value))} /></Field>
        <Field label="Meals per ₹1,000"><Input type="number" value={mealsPerThousand} onChange={(e) => setMealsPerThousand(Number(e.target.value))} /></Field>
        <Field label="Kits per ₹1,000"><Input type="number" value={kitsPerThousand} onChange={(e) => setKitsPerThousand(Number(e.target.value))} /></Field>
        <Field label="Blood units per ₹1,000"><Input type="number" value={unitsPerThousand} onChange={(e) => setUnitsPerThousand(Number(e.target.value))} /></Field>
      </div>
      <Button
        className="mt-4"
        size="sm"
        loading={save.isPending}
        onClick={() =>
          save.mutate({
            'home.stats': { zones, focusAreas, foundedYear, ageRange },
            'sponsor.ratios': { perRupee, mealsPerThousand, kitsPerThousand, unitsPerThousand },
          })
        }
      >
        Save
      </Button>
    </Card>
  );
}
