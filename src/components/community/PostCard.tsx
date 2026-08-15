import { useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { Avatar } from "./Avatar";
import { PostComments } from "./PostComments";
import { useToggleLike } from "@/lib/hooks/usePosts";
import { timeAgo } from "@/lib/format";
import type { PostFeed } from "@/lib/types";

export function PostCard({ post, showSpace = true }: { post: PostFeed; showSpace?: boolean }) {
  const toggleLike = useToggleLike();
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar name={post.author_name} size={38} />
        <div className="text-sm">
          <p className="font-semibold leading-tight">{post.author_name}</p>
          <p className="text-muted-foreground">
            {timeAgo(post.created_at)} ago
            {showSpace ? (
              <>
                {" "}
                in <span className="font-medium">{post.space_name}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <h2 className="mt-4 text-xl font-semibold leading-snug">{post.title}</h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{post.body}</p>
      {post.image_url ? (
        <img
          src={post.image_url}
          alt={post.title}
          className="mt-4 max-h-96 w-full rounded-lg border border-border object-cover"
        />
      ) : null}
      <div className="mt-4 flex gap-5 border-t border-border pt-3 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => toggleLike.mutate({ postId: post.id, liked: post.liked_by_me })}
          className={
            post.liked_by_me
              ? "flex items-center gap-1.5 text-foreground"
              : "flex items-center gap-1.5 transition-colors hover:text-foreground"
          }
        >
          <Heart className={post.liked_by_me ? "h-4 w-4 fill-current" : "h-4 w-4"} />{" "}
          {post.like_count}
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((value) => !value)}
          className="flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" /> {post.comment_count}
        </button>
      </div>
      {commentsOpen ? <PostComments postId={post.id} /> : null}
    </li>
  );
}
