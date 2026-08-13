import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, useShell } from "@/components/community/Shell";
import { Avatar } from "@/components/community/Avatar";
import { useJoinSpace, useLeaveSpace, useSpaceMembers, useSpaces } from "@/lib/hooks/useSpaces";
import { usePosts } from "@/lib/hooks/usePosts";
import { useEvents } from "@/lib/hooks/useEvents";
import { timeAgo, formatEventDate } from "@/lib/format";
import { ArrowLeft, Heart, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/spaces_/$slug")({
  head: () => ({
    meta: [
      { title: "Space — UJV Community" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpaceDetail,
});

function SpaceDetail() {
  const { slug } = Route.useParams();
  const { data: spaces = [], isLoading: spacesLoading } = useSpaces();
  const { data: posts = [] } = usePosts();
  const { data: events = [] } = useEvents();
  const { data: spaceMembers = [] } = useSpaceMembers(slug);
  const joinSpace = useJoinSpace();
  const leaveSpace = useLeaveSpace();

  const space = spaces.find((item) => item.slug === slug);

  if (!space) {
    return (
      <Shell>
        <div className="py-16 text-center text-muted-foreground">
          {spacesLoading ? "Loading…" : "This space doesn't exist."}
        </div>
      </Shell>
    );
  }

  const feed = posts.filter((post) => post.space_slug === slug);
  const upcoming = events.filter((event) => event.host_space_slug === slug).slice(0, 2);
  const isJoined = space.joined_by_me;

  return (
    <Shell>
      <Link
        to="/spaces"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All spaces
      </Link>

      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-32 bg-[image:var(--gradient-cover)]" />
        <div className="flex flex-wrap items-end justify-between gap-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {space.category}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{space.name}</h1>
            <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">{space.tagline}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {space.member_count.toLocaleString()} members · {space.post_count.toLocaleString()}{" "}
              posts
            </p>
          </div>
          <button
            type="button"
            onClick={() => (isJoined ? leaveSpace.mutate(slug) : joinSpace.mutate(slug))}
            className={
              isJoined
                ? "rounded-md border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
                : "rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            }
          >
            {isJoined ? "Joined ✓ Leave space" : "Join space"}
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <ul className="space-y-4">
          {feed.length === 0 ? (
            <li className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              No posts in this space yet.
            </li>
          ) : null}
          {feed.map((post) => (
            <li key={post.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={post.author_name} size={36} />
                <div className="text-sm">
                  <p className="font-semibold leading-tight">{post.author_name}</p>
                  <p className="text-muted-foreground">{timeAgo(post.created_at)} ago</p>
                </div>
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-snug">{post.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{post.body}</p>
              <div className="mt-4 flex gap-5 border-t border-border pt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" /> {post.like_count}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" /> 0
                </span>
              </div>
            </li>
          ))}
        </ul>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              In this space
            </h2>
            <ul className="mt-4 space-y-3">
              {spaceMembers.length === 0 ? (
                <li className="text-sm text-muted-foreground">No members yet — be the first.</li>
              ) : null}
              {spaceMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar name={member.name} size={32} />
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium leading-tight">{member.name}</p>
                    <p className="truncate text-muted-foreground">{member.role}</p>
                  </div>
                  <MessageButton memberId={member.id} memberName={member.name} />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Next in {space.name}
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {upcoming.length === 0 ? (
                <li className="text-muted-foreground">Nothing scheduled.</li>
              ) : null}
              {upcoming.map((event) => {
                const when = formatEventDate(event.starts_at);
                return (
                  <li key={event.id}>
                    <p className="font-medium leading-snug">{event.title}</p>
                    <p className="text-muted-foreground">
                      {when.day} {when.month} · {when.timeLabel}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </Shell>
  );
}

// Must be rendered inside <Shell> to read the real ShellContext value —
// calling useShell() in SpaceDetail itself (which renders <Shell> as a
// child) would only ever see the context's no-op default.
function MessageButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const { openChat } = useShell();
  return (
    <button
      type="button"
      onClick={() => openChat(memberId, memberName)}
      className="ml-auto shrink-0 text-xs font-medium text-primary hover:underline"
    >
      Message
    </button>
  );
}
