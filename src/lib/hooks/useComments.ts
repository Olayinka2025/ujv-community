import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "../auth";

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string;
};

export function useComments(postId: string | null) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(name)")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        post_id: row.post_id,
        author_id: row.author_id,
        body: row.body,
        created_at: row.created_at,
        author_name: (row.profiles as unknown as { name: string } | null)?.name ?? "Member",
      })) as Comment[];
    },
    enabled: Boolean(postId),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("comments")
        .insert({ post_id: postId, author_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["comments", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
