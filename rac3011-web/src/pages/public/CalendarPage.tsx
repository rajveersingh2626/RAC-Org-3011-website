import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useDocumentMeta } from '@/lib/meta';
import { fetchEvents, CALENDAR_ICS_PATH, type PublicEvent } from '@/lib/publicApi/events';
import { API_ORIGIN } from '@/lib/api';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarPage() {
  useDocumentMeta({ title: 'Calendar', description: 'District and club events.' });
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const from = startOfMonth(cursor);
  const to = endOfMonth(cursor);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['public', 'events', from.toISOString(), to.toISOString()],
    queryFn: () => fetchEvents(from, to),
  });

  const days = useMemo(() => {
    const firstDow = from.getDay();
    const padded = Array.from({ length: firstDow }, () => null as Date | null);
    return [...padded, ...eachDayOfInterval({ start: from, end: to })];
  }, [from, to]);

  const eventsOn = (day: Date | null): PublicEvent[] => {
    if (!day || !data) return [];
    return data.items.filter((e) => isSameDay(new Date(e.startsAt), day));
  };

  return (
    <Container>
      <Section
        eyebrow="District 3011"
        title="Calendar"
        action={
          <a
            href={`${API_ORIGIN}${CALENDAR_ICS_PATH}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[8px] border-2 border-accent px-4 text-[12.5px] font-bold text-accent hover:bg-accent-soft"
          >
            <Download aria-hidden className="size-4" /> Download year calendar
          </a>
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <IconButton label="Previous month" onClick={() => setCursor((c) => subMonths(c, 1))}>
            <ChevronLeft aria-hidden />
          </IconButton>
          <p className="m-0 text-[15px] font-extrabold text-fg">{format(cursor, 'MMMM yyyy')}</p>
          <IconButton label="Next month" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight aria-hidden />
          </IconButton>
        </div>

        {isPending ? (
          <Skeleton shape="rect" className="h-72" />
        ) : isError || !data ? (
          <ErrorState title="Couldn't load events" onRetry={() => void refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w, i) => (
                <div key={i} className="pb-1 text-[10.5px] font-bold uppercase tracking-wide text-fg-3">
                  {w}
                </div>
              ))}
              {days.map((day, i) => {
                const dayEvents = eventsOn(day);
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex min-h-[52px] flex-col items-center gap-1 rounded-[8px] border border-line py-1.5 text-[12px]',
                      day && isSameMonth(day, cursor) ? 'bg-surface text-fg' : 'bg-transparent text-fg-3 border-transparent',
                    )}
                  >
                    {day ? <span>{format(day, 'd')}</span> : null}
                    {dayEvents.length > 0 ? <span aria-hidden className="size-1.5 rounded-full bg-accent" /> : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              {data.items.length === 0 ? (
                <EmptyState title="No events this month" body="Check another month, or view the full year via the calendar download above." />
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {data.items
                    .slice()
                    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                    .map((event) => (
                      <li key={event.id}>
                        <Link
                          to={`/calendar/${event.slug}`}
                          className="flex items-center justify-between gap-3 rounded-[12px] border border-line-accent bg-surface p-4 hover:bg-accent-soft"
                        >
                          <div className="min-w-0">
                            <p className="m-0 truncate text-[13.5px] font-extrabold text-fg">{event.title}</p>
                            <p className="m-0 text-[11.5px] text-fg-3">{event.location ?? 'Location to be announced'}</p>
                          </div>
                          <span className="shrink-0 text-[12px] font-bold text-accent">
                            {format(new Date(event.startsAt), 'd MMM · h:mm a')}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </>
        )}
      </Section>
    </Container>
  );
}
