import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/community/Shell";
import { Avatar } from "@/components/community/Avatar";
import { PostComposer, type DraftPost } from "@/components/community/PostComposer";
import { PostCard } from "@/components/community/PostCard";
import { useAuth } from "@/lib/auth";
import { usePosts, useCreatePost } from "@/lib/hooks/usePosts";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { useEvents } from "@/lib/hooks/useEvents";
import { useMembers } from "@/lib/hooks/useMembers";
import { timeAgo, formatEventDate } from "@/lib/format";
import { Heart, Lock, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UJV — a community for people who make things" },
      {
        name: "description",
        content:
          "UJV is a community app: follow the discussion feed, join spaces, meet members and show up to events.",
      },
      { property: "og:title", content: "UJV — a community for people who make things" },
      {
        property: "og:description",
        content: "Follow the feed, join spaces, meet members and show up to events.",
      },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { profile, user } = useAuth();
  const { data: posts = [] } = usePosts();
  const { data: spaces = [] } = useSpaces();
  const { data: events = [] } = useEvents();
  const { data: members = [] } = useMembers();
  const createPost = useCreatePost();

  const [composerOpen, setComposerOpen] = useState(false);
  const [featuredStart, setFeaturedStart] = useState(0);

  const author = profile?.name ?? user?.email ?? "Member";
  const featured = posts.slice(featuredStart, featuredStart + 3);
  const canGoPrev = featuredStart > 0;
  const canGoNext = featuredStart + 3 < posts.length;

  const publish = (draft: DraftPost) => {
    createPost.mutate(
      { title: draft.title, body: draft.body, spaceSlug: draft.spaceSlug, imageUrl: draft.image },
      {
        onError: () => toast.error("Couldn't publish that post. Try again."),
      },
    );
  };

  const copyInvite = async () => {
    const link = `${window.location.origin}/login`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
          >
            <Avatar name={author} size={38} />
            <span className="text-base text-muted-foreground">
              What&apos;s on your mind, {author.split(" ")[0]}?
            </span>
          </button>

          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-lg font-semibold">Featured</h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous"
                  disabled={!canGoPrev}
                  onClick={() => setFeaturedStart((value) => Math.max(0, value - 3))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  disabled={!canGoNext}
                  onClick={() => setFeaturedStart((value) => value + 3)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto border-t border-border px-5 py-5">
              {featured.map((post) => (
                <article
                  key={post.id}
                  className="w-72 shrink-0 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={post.author_name} size={34} />
                    <div className="text-xs">
                      <p className="text-sm font-semibold leading-tight">{post.author_name}</p>
                      <p className="text-muted-foreground">
                        {timeAgo(post.created_at)} in{" "}
                        <span className="font-medium">{post.space_name}</span>
                      </p>
                    </div>
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                    {post.body}
                  </p>
                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4" /> {post.like_count}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" /> 0
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <ul className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ul>
        </div>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-40 bg-[image:var(--gradient-cover)]" />
            <div className="p-5">
              <h2 className="text-xl font-semibold">UJV Community</h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" /> Private group
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A quiet space for designers, founders and makers to connect, share and grow
                together.
              </p>
              <dl className="mt-5 grid grid-cols-3 divide-x divide-border border-y border-border py-4 text-center">
                <div>
                  <dt className="sr-only">Members</dt>
                  <dd className="text-xl font-semibold">{members.length}</dd>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div>
                  <dt className="sr-only">Posts</dt>
                  <dd className="text-xl font-semibold">{posts.length}</dd>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div>
                  <dt className="sr-only">Spaces</dt>
                  <dd className="text-xl font-semibold">{spaces.length}</dd>
                  <p className="text-xs text-muted-foreground">Spaces</p>
                </div>
              </dl>
              <div className="mt-4 flex -space-x-2">
                {members.slice(0, 5).map((member) => (
                  <span key={member.handle} className="ring-2 ring-card">
                    <Avatar name={member.name} size={32} />
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={copyInvite}
                className="mt-5 w-full rounded-md bg-primary py-2.5 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
              >
                Invite members
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Coming up
            </h2>
            <ul className="mt-4 space-y-4 text-sm">
              {events.slice(0, 3).map((event) => {
                const when = formatEventDate(event.starts_at);
                return (
                  <li key={event.id} className="flex gap-3">
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md bg-secondary font-display leading-none">
                      <span className="text-sm font-semibold">{when.day}</span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">{when.month}</span>
                    </span>
                    <span>
                      <span className="block font-medium leading-snug">{event.title}</span>
                      <span className="block text-muted-foreground">
                        {when.timeLabel} · {event.format}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link
              to="/events"
              className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
            >
              See the calendar
            </Link>
          </section>
        </aside>
      </div>

      <PostComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublish={publish}
        author={author}
      />
    </Shell>
  );
}
