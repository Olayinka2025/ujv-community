import { useState } from "react";
import { X, CheckCircle2, PlayCircle, Circle, Clock } from "lucide-react";
import { Avatar } from "./Avatar";
import { useUpdateCourseProgress } from "@/lib/hooks/useCourses";
import type { Course } from "@/lib/types";

type CourseWithProgress = Course & { progress: number };

function lessonsFor(course: CourseWithProgress) {
  const done = Math.round((course.progress / 100) * course.lessons);
  return Array.from({ length: course.lessons }, (_, index) => ({
    index,
    title: `Lesson ${index + 1} — ${course.title.split(":")[0]} part ${index + 1}`,
    length: `${8 + ((index * 3) % 14)} min`,
    done: index < done,
  }));
}

export function CourseViewer({
  course,
  onClose,
}: {
  course: CourseWithProgress;
  onClose: () => void;
}) {
  const updateProgress = useUpdateCourseProgress();
  const lessons = lessonsFor(course);
  const initial = lessons.find((lesson) => !lesson.done) ?? lessons[0]!;
  const [active, setActive] = useState(initial.index);
  const current = lessons[active]!;

  const advanceTo = (index: number) => {
    setActive(index);
    const doneCount = Math.round((course.progress / 100) * course.lessons);
    if (index + 1 > doneCount) {
      const progress = Math.round(((index + 1) / course.lessons) * 100);
      updateProgress.mutate({ courseSlug: course.slug, progress });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lift)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {course.level} · {course.duration}
            </p>
            <h2 className="truncate font-display text-lg font-semibold">{course.title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close course"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="p-5">
            <div className="flex aspect-video items-center justify-center rounded-lg bg-[image:var(--gradient-cover)]">
              <PlayCircle className="h-16 w-16 text-primary-foreground/90" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">{current.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {current.length}
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">{course.summary}</p>
            <div className="mt-5 flex items-center gap-2.5 text-sm">
              <Avatar name={course.instructor_name} size={30} />
              <span className="text-muted-foreground">Taught by {course.instructor_name}</span>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={active === 0}
                onClick={() => setActive((value) => Math.max(0, value - 1))}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={active === lessons.length - 1}
                onClick={() => advanceTo(Math.min(lessons.length - 1, active + 1))}
                className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Next lesson
              </button>
            </div>
          </div>

          <aside className="border-t border-border bg-surface p-4 md:border-l md:border-t-0">
            <p className="text-sm font-semibold">Lessons</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto">
              {lessons.map((lesson) => (
                <li key={lesson.index}>
                  <button
                    type="button"
                    onClick={() => setActive(lesson.index)}
                    className={
                      lesson.index === active
                        ? "flex w-full items-center gap-2 rounded-md bg-card px-3 py-2 text-left text-sm font-medium"
                        : "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-card"
                    }
                  >
                    {lesson.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">{lesson.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
