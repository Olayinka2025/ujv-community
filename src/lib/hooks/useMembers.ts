import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import type { Profile } from "../types";

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("name");
      if (error) throw error;
      return data as Profile[];
    },
  });
}

/** Maps profile id -> the names of spaces that member has joined. */
export function useMemberSpaces() {
  return useQuery({
    queryKey: ["member-spaces"],
    queryFn: async () => {
      const { data, error } = await supabase.from("space_members").select("user_id, spaces(name)");
      if (error) throw error;
      const map = new Map<string, string[]>();
      for (const row of data ?? []) {
        const name = (row.spaces as unknown as { name: string } | null)?.name;
        if (!name) continue;
        const list = map.get(row.user_id) ?? [];
        list.push(name);
        map.set(row.user_id, list);
      }
      return map;
    },
  });
}
