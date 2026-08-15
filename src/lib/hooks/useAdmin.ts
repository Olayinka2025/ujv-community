import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";

// ---------------- Spaces ----------------

export type SpaceInput = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
};

export function useCreateSpace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SpaceInput) => {
      const { error } = await supabase.from("spaces").insert(input);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spaces"] }),
  });
}

export function useUpdateSpace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, ...input }: SpaceInput) => {
      const { error } = await supabase.from("spaces").update(input).eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spaces"] }),
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.from("spaces").delete().eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spaces"] }),
  });
}

// ---------------- Events ----------------

export type EventInput = {
  id?: string | undefined;
  title: string;
  starts_at: string;
  host_space_slug: string;
  format: "Online" | "In person";
  location: string;
};

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<EventInput, "id">) => {
      const { error } = await supabase.from("events").insert(input);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: EventInput) => {
      if (!id) throw new Error("Missing event id");
      const { error } = await supabase.from("events").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
}

// ---------------- Courses ----------------

export type CourseInput = {
  slug: string;
  title: string;
  summary: string;
  instructor_name: string;
  lessons: number;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
};

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CourseInput) => {
      const { error } = await supabase.from("courses").insert(input);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, ...input }: CourseInput) => {
      const { error } = await supabase.from("courses").update(input).eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.from("courses").delete().eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}
