import { useState } from "react";
import { Send } from "lucide-react";
import { Avatar } from "./Avatar";
import { useComments, useCreateComment } from "@/lib/hooks/useComments";
import { timeAgo } from "@/lib/format";

/** The expanded comment thread + composer for a post. Mount only while open. */
export function PostComments({ postId }: { postId: string }) {
  const { data: comments = [] } = useComments(postId);
  const createComment = useCreateComment();
  const [draft, setDraft] = useState("");

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2.5">
          <Avatar name={comment.author_name} size={28} />
          <div className="min-w-0 text-sm">
            <p className="leading-snug">
              <span className="font-semibold">{comment.author_name}</span>{" "}
              <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
            </p>
            <p className="text-muted-foreground">{comment.body}</p>
          </div>
        </div>
      ))}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet — be the first.</p>
      ) : null}

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const text = draft.trim();
          if (!text) return;
          createComment.mutate({ postId, body: text });
          setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a comment…"
          className="w-full rounded-full bg-secondary px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Send comment"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
