import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, PageHeader } from "@/components/community/Shell";
import { Avatar } from "@/components/community/Avatar";
import { CourseViewer } from "@/components/community/CourseViewer";
import { useCourses, useCourseProgress } from "@/lib/hooks/useCourses";
import { BookOpen, Clock, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — learn with UJV" },
      {
        name: "description",
        content:
          "Short, practical courses from UJV members: finding your first customers, interface craft, story-first video and pricing.",
      },
      { property: "og:title", content: "Courses — learn with UJV" },
      {
        property: "og:description",
        content: "Practical courses taught by the people in the community.",
      },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { data: courses = [] } = useCourses();
  const { data: progressRows = [] } = useCourseProgress();
  const progressMap = new Map(progressRows.map((row) => [row.course_slug, row.progress]));
  const withProgress = courses.map((course) => ({
    ...course,
    progress: progressMap.get(course.slug) ?? 0,
  }));

  const inProgress = withProgress.filter((course) => course.progress > 0 && course.progress < 100);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = activeSlug ? (withProgress.find((c) => c.slug === activeSlug) ?? null) : null;

  return (
    <Shell>
      <PageHeader
        eyebrow="Courses"
        title="Learn from people in the room."
        description="Short courses taught by members, built to be finished in an afternoon. Pick up where you left off."
      />

      {inProgress.length > 0 && (
        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Continue learning
          </h2>
          <ul className="mt-4 space-y-4">
            {inProgress.map((course) => (
              <li key={course.slug} className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label={`Continue ${course.title}`}
                  onClick={() => setActiveSlug(course.slug)}
                >
                  <PlayCircle className="h-9 w-9 shrink-0 text-primary" />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setActiveSlug(course.slug)}
                    className="block w-full truncate text-left font-medium hover:underline"
                  >
                    {course.title}
                  </button>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{course.progress}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {withProgress.map((course) => (
          <article
            key={course.slug}
            className="flex flex-col rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-1">{course.level}</span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> {course.lessons} lessons
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {course.duration}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold leading-snug">{course.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {course.summary}
            </p>
            <div className="mt-4 flex items-center gap-2.5 text-sm">
              <Avatar name={course.instructor_name} size={30} />
              <span className="text-muted-foreground">{course.instructor_name}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSlug(course.slug)}
              className="mt-5 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {course.progress === 100
                ? "Review course"
                : course.progress > 0
                  ? "Continue course"
                  : "Start course"}
            </button>
          </article>
        ))}
      </div>

      {active ? <CourseViewer course={active} onClose={() => setActiveSlug(null)} /> : null}
    </Shell>
  );
}
