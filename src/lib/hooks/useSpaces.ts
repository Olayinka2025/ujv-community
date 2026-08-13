import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "../auth";
import type { Profile, SpaceFeed } from "../types";

export function useSpaces() {
  return useQuery({
    queryKey: ["spaces"],
    queryFn: async () => {
      const { data, error } = await supabase.from("space_feed").select("*").order("name");
      if (error) throw error;
      return data as SpaceFeed[];
    },
  });
}

export function useJoinSpace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (slug: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("space_members")
        .insert({ space_slug: slug, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_data, slug) => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      queryClient.invalidateQueries({ queryKey: ["space-members", slug] });
    },
  });
}

export function useLeaveSpace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (slug: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("space_members")
        .delete()
        .eq("space_slug", slug)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: (_data, slug) => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      queryClient.invalidateQueries({ queryKey: ["space-members", slug] });
    },
  });
}

export function useSpaceMembers(slug: string | undefined) {
  return useQuery({
    queryKey: ["space-members", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("space_members")
        .select("profiles(id, name, handle, role, location, created_at)")
        .eq("space_slug", slug!);
      if (error) throw error;
      return (data ?? [])
        .map((row) => row.profiles as unknown as Profile | null)
        .filter((profile): profile is Profile => Boolean(profile));
    },
    enabled: Boolean(slug),
  });
}
