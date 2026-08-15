import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Shell, PageHeader } from "@/components/community/Shell";
import { useAuth } from "@/lib/auth";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { useEvents } from "@/lib/hooks/useEvents";
import { useCourses } from "@/lib/hooks/useCourses";
import {
  useCreateSpace,
  useUpdateSpace,
  useDeleteSpace,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  type SpaceInput,
  type EventInput,
  type CourseInput,
} from "@/lib/hooks/useAdmin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — UJV Community" }],
  }),
  component: AdminPage,
});

const tabs = ["Spaces", "Events", "Courses"] as const;
type Tab = (typeof tabs)[number];

function AdminPage() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("Spaces");

  if (loading) {
    return <Shell>{null}</Shell>;
  }

  if (!profile?.is_admin) {
    return (
      <Shell>
        <PageHeader
          eyebrow="Admin"
          title="Not authorized"
          description="This area is for community admins only."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Admin"
        title="Manage the community."
        description="Create and edit spaces, events and courses."
      />
      <div className="mt-8 flex gap-1 border-b border-border">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={
              item === tab
                ? "border-b-2 border-primary px-4 py-2 text-sm font-medium text-foreground"
                : "border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "Spaces" ? <SpacesAdmin /> : null}
        {tab === "Events" ? <EventsAdmin /> : null}
        {tab === "Courses" ? <CoursesAdmin /> : null}
      </div>
    </Shell>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label="Edit"
        onClick={onEdit}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Delete"
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ModalForm({
  title,
  onClose,
  onSubmit,
  children,
  submitLabel,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
  submitLabel: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 py-10"
      onClick={onClose}
    >
      <form
        className="w-full max-w-md rounded-xl border border-border bg-card p-5"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold">{title}</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3">{children}</div>
        <button
          type="submit"
          className="mt-5 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-ring disabled:opacity-60";

// ---------------- Spaces ----------------

function SpacesAdmin() {
  const { data: spaces = [] } = useSpaces();
  const createSpace = useCreateSpace();
  const updateSpace = useUpdateSpace();
  const deleteSpace = useDeleteSpace();
  const [editing, setEditing] = useState<SpaceInput | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New space
        </button>
      </div>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {spaces.map((space) => (
          <li key={space.slug} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {space.name} <span className="text-xs text-muted-foreground">/{space.slug}</span>
              </p>
              <p className="truncate text-sm text-muted-foreground">{space.tagline}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{space.category}</span>
            <RowActions
              onEdit={() =>
                setEditing({
                  slug: space.slug,
                  name: space.name,
                  tagline: space.tagline,
                  category: space.category,
                })
              }
              onDelete={() => {
                if (
                  window.confirm(
                    `Delete "${space.name}"? This also removes its posts and memberships.`,
                  )
                ) {
                  deleteSpace.mutate(space.slug, {
                    onError: () => toast.error("Couldn't delete that space."),
                  });
                }
              }}
            />
          </li>
        ))}
      </ul>

      {creating || editing ? (
        <SpaceForm
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={(input) => {
            const mutation = editing ? updateSpace : createSpace;
            mutation.mutate(input, {
              onSuccess: () => {
                toast.success(editing ? "Space updated" : "Space created");
                setCreating(false);
                setEditing(null);
              },
              onError: () => toast.error("Couldn't save that space."),
            });
          }}
        />
      ) : null}
    </div>
  );
}

function SpaceForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: SpaceInput | null;
  onClose: () => void;
  onSubmit: (input: SpaceInput) => void;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");

  return (
    <ModalForm
      title={initial ? "Edit space" : "New space"}
      onClose={onClose}
      submitLabel={initial ? "Save changes" : "Create space"}
      onSubmit={() => {
        if (!slug.trim() || !name.trim()) return;
        onSubmit({
          slug: slug.trim(),
          name: name.trim(),
          tagline: tagline.trim(),
          category: category.trim(),
        });
      }}
    >
      <FormField label="Slug">
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          disabled={Boolean(initial)}
          placeholder="design-lab"
          className={fieldClass}
        />
      </FormField>
      <FormField label="Name">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
      </FormField>
      <FormField label="Tagline">
        <textarea
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
          rows={2}
          className={fieldClass}
        />
      </FormField>
      <FormField label="Category">
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={fieldClass}
        />
      </FormField>
    </ModalForm>
  );
}

// ---------------- Events ----------------

function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function EventsAdmin() {
  const { data: events = [] } = useEvents();
  const { data: spaces = [] } = useSpaces();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const [editing, setEditing] = useState<EventInput | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New event
        </button>
      </div>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {events.map((event) => (
          <li key={event.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{event.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {new Date(event.starts_at).toLocaleString()} · {event.host_name} · {event.format}
              </p>
            </div>
            <RowActions
              onEdit={() =>
                setEditing({
                  id: event.id,
                  title: event.title,
                  starts_at: event.starts_at,
                  host_space_slug: event.host_space_slug,
                  format: event.format,
                  location: event.location,
                })
              }
              onDelete={() => {
                if (window.confirm(`Delete "${event.title}"? This also removes its RSVPs.`)) {
                  deleteEvent.mutate(event.id, {
                    onError: () => toast.error("Couldn't delete that event."),
                  });
                }
              }}
            />
          </li>
        ))}
      </ul>

      {creating || editing ? (
        <EventForm
          initial={editing}
          spaces={spaces}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={(input) => {
            const mutation = editing ? updateEvent : createEvent;
            mutation.mutate(input, {
              onSuccess: () => {
                toast.success(editing ? "Event updated" : "Event created");
                setCreating(false);
                setEditing(null);
              },
              onError: () => toast.error("Couldn't save that event."),
            });
          }}
        />
      ) : null}
    </div>
  );
}

function EventForm({
  initial,
  spaces,
  onClose,
  onSubmit,
}: {
  initial: EventInput | null;
  spaces: { slug: string; name: string }[];
  onClose: () => void;
  onSubmit: (input: EventInput) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startsAt, setStartsAt] = useState(
    initial ? toDatetimeLocal(initial.starts_at) : toDatetimeLocal(new Date().toISOString()),
  );
  const [hostSlug, setHostSlug] = useState(initial?.host_space_slug ?? spaces[0]?.slug ?? "");
  const [format, setFormat] = useState<"Online" | "In person">(initial?.format ?? "Online");
  const [location, setLocation] = useState(initial?.location ?? "");

  return (
    <ModalForm
      title={initial ? "Edit event" : "New event"}
      onClose={onClose}
      submitLabel={initial ? "Save changes" : "Create event"}
      onSubmit={() => {
        if (!title.trim() || !hostSlug || !startsAt) return;
        onSubmit({
          id: initial?.id,
          title: title.trim(),
          starts_at: new Date(startsAt).toISOString(),
          host_space_slug: hostSlug,
          format,
          location: location.trim(),
        });
      }}
    >
      <FormField label="Title">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClass}
        />
      </FormField>
      <FormField label="Date & time">
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className={fieldClass}
        />
      </FormField>
      <FormField label="Host space">
        <select
          value={hostSlug}
          onChange={(event) => setHostSlug(event.target.value)}
          className={fieldClass}
        >
          {spaces.map((space) => (
            <option key={space.slug} value={space.slug}>
              {space.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Format">
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as "Online" | "In person")}
          className={fieldClass}
        >
          <option value="Online">Online</option>
          <option value="In person">In person</option>
        </select>
      </FormField>
      <FormField label="Location">
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Community stage / Yaba, Lagos"
          className={fieldClass}
        />
      </FormField>
    </ModalForm>
  );
}

// ---------------- Courses ----------------

function CoursesAdmin() {
  const { data: courses = [] } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const [editing, setEditing] = useState<CourseInput | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New course
        </button>
      </div>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {courses.map((course) => (
          <li key={course.slug} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{course.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {course.instructor_name} · {course.lessons} lessons · {course.level}
              </p>
            </div>
            <RowActions
              onEdit={() => setEditing(course)}
              onDelete={() => {
                if (
                  window.confirm(`Delete "${course.title}"? This also removes members' progress.`)
                ) {
                  deleteCourse.mutate(course.slug, {
                    onError: () => toast.error("Couldn't delete that course."),
                  });
                }
              }}
            />
          </li>
        ))}
      </ul>

      {creating || editing ? (
        <CourseForm
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={(input) => {
            const mutation = editing ? updateCourse : createCourse;
            mutation.mutate(input, {
              onSuccess: () => {
                toast.success(editing ? "Course updated" : "Course created");
                setCreating(false);
                setEditing(null);
              },
              onError: () => toast.error("Couldn't save that course."),
            });
          }}
        />
      ) : null}
    </div>
  );
}

function CourseForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: CourseInput | null;
  onClose: () => void;
  onSubmit: (input: CourseInput) => void;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [instructorName, setInstructorName] = useState(initial?.instructor_name ?? "");
  const [lessons, setLessons] = useState(initial?.lessons ?? 1);
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [level, setLevel] = useState<CourseInput["level"]>(initial?.level ?? "Beginner");

  return (
    <ModalForm
      title={initial ? "Edit course" : "New course"}
      onClose={onClose}
      submitLabel={initial ? "Save changes" : "Create course"}
      onSubmit={() => {
        if (!slug.trim() || !title.trim()) return;
        onSubmit({
          slug: slug.trim(),
          title: title.trim(),
          summary: summary.trim(),
          instructor_name: instructorName.trim(),
          lessons,
          duration: duration.trim(),
          level,
        });
      }}
    >
      <FormField label="Slug">
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          disabled={Boolean(initial)}
          placeholder="interface-craft"
          className={fieldClass}
        />
      </FormField>
      <FormField label="Title">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClass}
        />
      </FormField>
      <FormField label="Summary">
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={2}
          className={fieldClass}
        />
      </FormField>
      <FormField label="Instructor name">
        <input
          value={instructorName}
          onChange={(event) => setInstructorName(event.target.value)}
          className={fieldClass}
        />
      </FormField>
      <FormField label="Lessons">
        <input
          type="number"
          min={1}
          value={lessons}
          onChange={(event) => setLessons(Number(event.target.value))}
          className={fieldClass}
        />
      </FormField>
      <FormField label="Duration">
        <input
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          placeholder="1h 40m"
          className={fieldClass}
        />
      </FormField>
      <FormField label="Level">
        <select
          value={level}
          onChange={(event) => setLevel(event.target.value as CourseInput["level"])}
          className={fieldClass}
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </FormField>
    </ModalForm>
  );
}
