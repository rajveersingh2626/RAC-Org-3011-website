import { Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { activitySummaryDetail, activitySummaryLabel } from '@/lib/reports/values';

export interface ActivityListProps {
  activities: Record<string, unknown>[];
  monthLabel: string;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function ActivityList({ activities, monthLabel, onEdit, onRemove }: ActivityListProps) {
  return (
    <Card eyebrow={`${monthLabel.toUpperCase()} — ACTIVITIES ADDED`}>
      {activities.length === 0 ? (
        <p className="m-0 text-[12.5px] text-fg-3">Nothing added yet. Fill in the form to add the first activity.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {activities.map((activity, index) => (
            <li key={index} className="flex items-center gap-2 rounded-[8px] bg-page px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[12.5px] font-bold text-fg">{activitySummaryLabel(activity)}</p>
                <p className="m-0 truncate text-[11px] text-fg-3">{activitySummaryDetail(activity) || 'No detail yet'}</p>
              </div>
              <IconButton label={`Edit activity ${index + 1}`} onClick={() => onEdit(index)}>
                <Pencil aria-hidden />
              </IconButton>
              <IconButton label={`Remove activity ${index + 1}`} onClick={() => onRemove(index)}>
                <Trash2 aria-hidden />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[12px] leading-relaxed text-fg-2">
        A club that did nothing in a month still files the month — a nil return is a valid submission and keeps the compliance
        record honest.
      </p>
    </Card>
  );
}
