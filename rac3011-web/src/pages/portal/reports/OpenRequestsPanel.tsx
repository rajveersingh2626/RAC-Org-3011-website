import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchReportRequests, putReportRequestResponse } from '@/lib/reports/api';
import type { ReportRequest } from '@/lib/reports/types';

function RequestCard({ request, clubId }: { request: ReportRequest; clubId: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState(false);

  const mutation = useMutation({
    mutationFn: () => putReportRequestResponse(request.id, clubId, answers),
    onSuccess: () => setAnswered(true),
  });

  const dueLabel = new Date(request.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="rounded-[12px] border border-line-accent p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="m-0 text-[13.5px] font-bold text-fg">{request.title}</p>
        {answered ? <Badge tone="green">Answered</Badge> : <Badge tone="pink">Due {dueLabel}</Badge>}
      </div>
      {request.description && <p className="m-0 mb-3 text-[12px] text-fg-2">{request.description}</p>}
      <div className="flex flex-col gap-3">
        {request.questions.map((question, index) => (
          <label key={index} className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-fg">{question}</span>
            <Textarea
              rows={2}
              value={answers[String(index)] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [String(index)]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <Button className="mt-3" size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
        {answered ? 'Update answer' : 'Send answer'}
      </Button>
    </div>
  );
}

export function OpenRequestsPanel({ clubId }: { clubId: string }) {
  const query = useQuery({ queryKey: ['report-requests'], queryFn: fetchReportRequests });

  if (query.isPending) return <Skeleton shape="rect" className="h-32" />;
  if (query.isError || (query.data ?? []).length === 0) return null;

  return (
    <Card eyebrow="OPEN REQUESTS FROM THE DISTRICT">
      <div className="flex flex-col gap-4">
        {query.data.map((request) => (
          <RequestCard key={request.id} request={request} clubId={clubId} />
        ))}
      </div>
    </Card>
  );
}
