import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "../auth";
import type { Course, CourseProgress } from "../types";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("title");
      if (error) throw error;
      return data as Course[];
    },
  });
}

export function useCourseProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["course-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_progress")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as CourseProgress[];
    },
    enabled: Boolean(user),
  });
}

export function useUpdateCourseProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ courseSlug, progress }: { courseSlug: string; progress: number }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("course_progress").upsert({
        course_slug: courseSlug,
        user_id: user.id,
        progress,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-progress"] });
    },
  });
}
