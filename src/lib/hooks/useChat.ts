import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "../auth";
import type { ConversationSummary, Message } from "../types";

type ConversationFeedRow = {
  id: string;
  other_user_id: string;
  other_user_name: string;
  last_message_body: string | null;
  last_message_at: string | null;
};

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_feed")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;

      return (data as ConversationFeedRow[]).map((row): ConversationSummary => ({
        id: row.id,
        otherUserId: row.other_user_id,
        otherName: row.other_user_name,
        lastMessageBody: row.last_message_body,
        lastMessageAt: row.last_message_at,
      }));
    },
    enabled: Boolean(user),
  });
}

/** Finds the existing 1:1 conversation with `otherUserId`, or creates one. */
export function useOrCreateConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("Not signed in");

      const { data: existing, error: findError } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(user_a.eq.${user.id},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${user.id})`,
        )
        .maybeSingle();
      if (findError) throw findError;
      if (existing) return existing.id as string;

      const { data: created, error: insertError } = await supabase
        .from("conversations")
        .insert({ user_a: user.id, user_b: otherUserId })
        .select("id")
        .single();
      if (insertError) throw insertError;
      return created.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId) return;
    // Random suffix avoids colliding with a same-named channel from a previous
    // mount whose async removeChannel() hasn't finished yet.
    const channel = supabase
      .channel(`messages:${conversationId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
