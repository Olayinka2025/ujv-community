import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "../auth";
import type { Call, CallStatus } from "../types";

type CallRow = {
  id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  kind: "audio" | "video";
  status: CallStatus;
  room_name: string;
  created_at: string;
  ended_at: string | null;
  caller: { name: string } | null;
  callee: { name: string } | null;
};

export type ActiveCall = Call & {
  callerName: string;
  calleeName: string;
};

function mapRow(row: CallRow): ActiveCall {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    callerId: row.caller_id,
    calleeId: row.callee_id,
    kind: row.kind,
    status: row.status,
    roomName: row.room_name,
    createdAt: row.created_at,
    endedAt: row.ended_at,
    callerName: row.caller?.name ?? "Someone",
    calleeName: row.callee?.name ?? "Someone",
  };
}

/** The one call (ringing or active) I'm currently a part of, if any — the
 * single source of truth CallOverlay renders from, kept fresh by realtime. */
export function useMyActiveCall() {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["active-call", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select(
          "*, caller:profiles!calls_caller_id_fkey(name), callee:profiles!calls_callee_id_fkey(name)",
        )
        .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
        .in("status", ["ringing", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data as CallRow) : null;
    },
    enabled: Boolean(userId),
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const suffix = () => Math.random().toString(36).slice(2);
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["active-call", userId] });

    const callerChannel = supabase
      .channel(`calls:caller:${userId}:${suffix()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calls", filter: `caller_id=eq.${userId}` },
        invalidate,
      )
      .subscribe();
    const calleeChannel = supabase
      .channel(`calls:callee:${userId}:${suffix()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calls", filter: `callee_id=eq.${userId}` },
        invalidate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callerChannel);
      supabase.removeChannel(calleeChannel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useStartCall() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      calleeId,
      kind,
    }: {
      conversationId: string;
      calleeId: string;
      kind: "audio" | "video";
    }) => {
      if (!user) throw new Error("Not signed in");
      const roomName = `ujv-${crypto.randomUUID().replace(/-/g, "")}`;
      const { data, error } = await supabase
        .from("calls")
        .insert({
          conversation_id: conversationId,
          caller_id: user.id,
          callee_id: calleeId,
          kind,
          room_name: roomName,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
  });
}

export function useRespondToCall() {
  return useMutation({
    mutationFn: async ({ callId, status }: { callId: string; status: CallStatus }) => {
      const { error } = await supabase
        .from("calls")
        .update({
          status,
          ...(status !== "ringing" && status !== "active"
            ? { ended_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", callId);
      if (error) throw error;
    },
  });
}
