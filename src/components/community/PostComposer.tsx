import { useRef, useState } from "react";
import { X, Image as ImageIcon, Paperclip } from "lucide-react";
import { Avatar } from "./Avatar";
import { useSpaces } from "@/lib/hooks/useSpaces";

export type DraftPost = {
  title: string;
  body: string;
  spaceSlug: string;
  image?: string | undefined;
};

export function PostComposer({
  open,
  onClose,
  onPublish,
  author,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: (draft: DraftPost) => void;
  author: string;
}) {
  const { data: spaces = [] } = useSpaces();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [spaceSlug, setSpaceSlug] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const activeSlug = spaceSlug || spaces[0]?.slug || "";

  const reset = () => {
    setTitle("");
    setBody("");
    setImage(undefined);
    setFileName(undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-[var(--shadow-lift)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-display text-base font-semibold">Create a post</p>
          <button
            type="button"
            aria-label="Close composer"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="px-5 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            if ((!title.trim() && !body.trim()) || !activeSlug) return;
            onPublish({
              title: title.trim() || "Untitled post",
              body: body.trim(),
              spaceSlug: activeSlug,
              image,
            });
            reset();
            onClose();
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar name={author} size={38} />
            <div className="text-sm">
              <p className="font-semibold leading-tight">{author}</p>
              <label className="text-muted-foreground">
                Posting in{" "}
                <select
                  value={activeSlug}
                  onChange={(event) => setSpaceSlug(event.target.value)}
                  className="rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-foreground outline-none"
                >
                  {spaces.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your post a title"
            className="mt-5 w-full border-b border-border bg-transparent pb-2 font-display text-xl font-semibold outline-none placeholder:text-muted-foreground"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            placeholder="Write something worth reading…"
            className="mt-4 w-full resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-muted-foreground"
          />

          {image ? (
            <div className="relative mt-2 overflow-hidden rounded-lg border border-border">
              <img src={image} alt="Attached preview" className="max-h-72 w-full object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => setImage(undefined)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {fileName ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" /> {fileName}
            </p>
          ) : null}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              const reader = new FileReader();
              reader.onload = () => setImage(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />

          <div className="mt-6 flex items-center gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <ImageIcon className="h-4 w-4" /> Add image
            </button>
            <button
              type="submit"
              disabled={!activeSlug}
              className="ml-auto rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
