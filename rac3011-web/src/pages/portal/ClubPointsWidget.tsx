import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { currentRyYear, formatMonthLabel } from '@/lib/reports/month';
import { fetchClubPoints } from '@/lib/points/api';

export function ClubPointsWidget({ clubId }: { clubId: string }) {
  const ryYear = currentRyYear();
  const query = useQuery({
    queryKey: ['club-points', clubId, ryYear],
    queryFn: () => fetchClubPoints(clubId, { ryYear }),
  });

  if (query.isPending) return <Skeleton shape="rect" className="h-64" />;
  if (query.isError || !query.data) return null;

  const { total, byMonth, byCategory } = query.data;
  const max = Math.max(1, ...byMonth.map((m) => m.points));
  const topCategories = [...byCategory].sort((a, b) => b.points - a.points).slice(0, 5);

  return (
    <Card eyebrow="Our points this year" title={String(total)}>
      <p className="m-0 mb-4 text-[12px] text-fg-3">
        across {byMonth.length} scored month{byMonth.length === 1 ? '' : 's'}
      </p>

      {byMonth.length > 0 && (
        <div role="img" aria-label="Monthly points trend" className="flex h-24 items-end gap-2">
          {byMonth.map((m) => (
            <div
              key={m.periodKey}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${formatMonthLabel(m.periodKey)}: ${m.points} pts`}
            >
              <div
                className="w-full min-h-1 rounded-t-[4px] bg-accent"
                style={{ height: `${Math.max(4, (m.points / max) * 100)}%` }}
              />
              <span className="text-[10px] font-bold uppercase text-fg-3">{m.periodKey.slice(5)}</span>
            </div>
          ))}
        </div>
      )}

      {topCategories.length > 0 && (
        <div className="mt-5 flex flex-col gap-2 border-t border-line-accent pt-4">
          {topCategories.map((c) => (
            <div key={c.categoryId} className="flex items-center justify-between text-[12.5px]">
              <span className="text-fg-2">{c.categoryName}</span>
              <span className="font-bold text-fg">{c.points}</span>
            </div>
          ))}
        </div>
      )}

      <p className="m-0 mt-4 text-[11px] text-fg-3">
        You see your own club&apos;s points only. No club can see another&apos;s.
      </p>
    </Card>
  );
}
