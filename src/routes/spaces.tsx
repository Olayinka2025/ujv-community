import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, PageHeader } from "@/components/community/Shell";
import { useJoinSpace, useLeaveSpace, useSpaces } from "@/lib/hooks/useSpaces";

export const Route = createFileRoute("/spaces")({
  head: () => ({
    meta: [
      { title: "Spaces — UJV community" },
      {
        name: "description",
        content:
          "Browse UJV spaces: product builders, design critique, founders, creator collabs and daily study hall.",
      },
      { property: "og:title", content: "Spaces — UJV community" },
      {
        property: "og:description",
        content: "Small rooms with a clear purpose. Join the ones that fit your work.",
      },
    ],
  }),
  component: SpacesPage,
});

function SpacesPage() {
  const { data: spaces = [] } = useSpaces();
  const joinSpace = useJoinSpace();
  const leaveSpace = useLeaveSpace();

  return (
    <Shell>
      <PageHeader
        eyebrow="Spaces"
        title="Small rooms, clear purpose."
        description="Every space has a host, a rhythm and a reason to post. Join a few, mute the rest — nothing here is a firehose."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {spaces.map((space) => {
          const isJoined = space.joined_by_me;
          return (
            <article
              key={space.slug}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lift"
            >
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {space.category}
              </span>
              <Link to="/spaces/$slug" params={{ slug: space.slug }} className="mt-3">
                <h2 className="text-xl font-semibold hover:underline">{space.name}</h2>
              </Link>
              <p className="mt-2 flex-1 leading-relaxed text-muted-foreground">{space.tagline}</p>
              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {space.member_count.toLocaleString()} members ·{" "}
                  {space.post_count.toLocaleString()} posts
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to="/spaces/$slug"
                    params={{ slug: space.slug }}
                    className="rounded-md border border-border px-3 py-1.5 font-medium transition-colors hover:bg-secondary"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      isJoined ? leaveSpace.mutate(space.slug) : joinSpace.mutate(space.slug)
                    }
                    className={
                      isJoined
                        ? "rounded-md border border-border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-secondary"
                        : "rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    }
                  >
                    {isJoined ? "Joined ✓" : "Join"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
