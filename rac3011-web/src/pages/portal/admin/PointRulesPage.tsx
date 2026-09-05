import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { currentRyYear } from '@/lib/reports/month';
import { createPointRule, fetchPointCategories, fetchPointRules, updatePointRule } from '@/lib/points/api';
import type { PointRule } from '@/lib/points/types';
import { PointRuleEditorModal, type PointRuleFormValues } from './PointRuleEditorModal';

function ruleSummary(rule: PointRule): string {
  if (rule.ruleType === 'tiered') {
    return rule.tiers.map((t) => `${t.min}${t.max === null ? '+' : `–${t.max}`} → ${t.points}`).join(' · ');
  }
  if (rule.ruleType === 'per_unit') {
    return `${rule.points ?? 0} per unit${rule.perUnitCap ? `, capped at ${rule.perUnitCap}` : ''}`;
  }
  return String(rule.points ?? 0);
}

export function PointRulesPage() {
  useDocumentMeta({ title: 'Point rules' });
  const qc = useQueryClient();
  const ryYear = currentRyYear();
  const [editing, setEditing] = useState<PointRule | null | 'new'>(null);

  const categoriesQuery = useQuery({ queryKey: ['point-categories'], queryFn: fetchPointCategories });
  const rulesQuery = useQuery({ queryKey: ['point-rules', ryYear], queryFn: () => fetchPointRules(ryYear) });

  const saveMutation = useMutation({
    mutationFn: (values: PointRuleFormValues) =>
      editing && editing !== 'new'
        ? updatePointRule(editing.id, values)
        : createPointRule(values),
    onSuccess: () => {
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ['point-rules', ryYear] });
    },
  });

  const byCategory = useMemo(() => {
    const map = new Map<string, PointRule[]>();
    for (const rule of rulesQuery.data ?? []) {
      const list = map.get(rule.categoryId) ?? [];
      list.push(rule);
      map.set(rule.categoryId, list);
    }
    return map;
  }, [rulesQuery.data]);

  if (categoriesQuery.isPending || rulesQuery.isPending) {
    return (
      <Container width="wide">
        <Skeleton shape="rect" className="h-96" />
      </Container>
    );
  }
  if (categoriesQuery.isError || rulesQuery.isError) {
    return (
      <Container width="wide">
        <ErrorState title="Couldn't load point rules" onRetry={() => void rulesQuery.refetch()} />
      </Container>
    );
  }

  return (
    <Container width="wide">
      <Section
        eyebrow={`RY ${ryYear}–${(ryYear + 1) % 100}`}
        title="Point rules"
        description="Thirteen categories from the RID 3011 points document. Editing a rule changes future months only."
      >
        <div className="mb-5 flex justify-end">
          <Button leading={<Plus size={16} />} onClick={() => setEditing('new')}>
            New rule
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          {categoriesQuery.data.map((category) => {
            const rules = byCategory.get(category.id) ?? [];
            if (rules.length === 0) return null;
            return (
              <Card key={category.id} eyebrow={`${rules.length} rule${rules.length === 1 ? '' : 's'}`} title={category.name}>
                <div className="mt-3 flex flex-col gap-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-accent pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="m-0 text-[13.5px] font-bold text-fg">{rule.label}</p>
                        <p className="m-0 font-mono text-[11px] text-fg-3">
                          {rule.sourceType}:{rule.sourceKey}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{rule.ruleType.toUpperCase()}</Badge>
                        <Badge tone={rule.isActive ? 'blue' : 'neutral'}>{rule.period.toUpperCase()}</Badge>
                        <span className="text-[12px] text-fg-3">{ruleSummary(rule)}</span>
                        {!rule.isActive && <Badge tone="amber">Inactive</Badge>}
                        <Button variant="link" size="sm" onClick={() => setEditing(rule)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <PointRuleEditorModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={(values) => saveMutation.mutate(values)}
        saving={saveMutation.isPending}
        categories={categoriesQuery.data}
        ryYear={ryYear}
        initial={editing && editing !== 'new' ? editing : null}
      />
    </Container>
  );
}
