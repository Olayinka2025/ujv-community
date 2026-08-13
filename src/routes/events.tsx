import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader } from "@/components/community/Shell";
import { useEvents, useRsvp } from "@/lib/hooks/useEvents";
import { formatEventDate } from "@/lib/format";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — UJV community" },
      {
        name: "description",
        content:
          "Critique nights, founder breakfasts, collab speed-matching and daily deep work sprints on the UJV calendar.",
      },
      { property: "og:title", content: "Events — UJV community" },
      {
        property: "og:description",
        content: "Critique nights, founder breakfasts and daily deep work sprints.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data: events = [] } = useEvents();
  const rsvp = useRsvp();

  return (
    <Shell>
      <PageHeader
        eyebrow="Events"
        title="Show up, then get back to work."
        description="Short sessions hosted by members. Online rooms open five minutes early; in-person meets cap at twenty people."
      />
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {events.map((event) => {
          const when = formatEventDate(event.starts_at);
          return (
            <li key={event.id} className="flex flex-wrap items-center gap-6 py-6">
              <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary font-display text-primary-foreground">
                <span className="text-xl font-semibold leading-none">{when.day}</span>
                <span className="mt-1 text-[10px] tracking-widest opacity-70">{when.month}</span>
              </span>
              <div className="min-w-56 flex-1">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {when.dateLabel} · {when.timeLabel} · Hosted by {event.host_name}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{event.format}</p>
                <p>{event.location}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{event.going_count} going</span>
                <button
                  type="button"
                  onClick={() => rsvp.mutate({ eventId: event.id, going: event.going_by_me })}
                  className={
                    event.going_by_me
                      ? "rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                      : "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  }
                >
                  {event.going_by_me ? "Going ✓" : "RSVP"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
