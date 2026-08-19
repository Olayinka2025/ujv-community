-- UJV Community — in-app voice/video call signaling (ringing, accept/decline).
-- Run this once in the Supabase SQL Editor, same as the earlier migrations.

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  caller_id uuid not null references public.profiles (id) on delete cascade,
  callee_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('audio', 'video')),
  status text not null default 'ringing'
    check (status in ('ringing', 'active', 'declined', 'ended', 'missed')),
  room_name text not null,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index calls_callee_id_idx on public.calls (callee_id, status);
create index calls_conversation_id_idx on public.calls (conversation_id);

alter table public.calls enable row level security;

create policy "Participants can view their calls"
  on public.calls for select to authenticated
  using (auth.uid() in (caller_id, callee_id));

create policy "Callers can start calls they're part of"
  on public.calls for insert to authenticated
  with check (
    auth.uid() = caller_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

create policy "Participants can update their call status"
  on public.calls for update to authenticated
  using (auth.uid() in (caller_id, callee_id))
  with check (auth.uid() in (caller_id, callee_id));

alter publication supabase_realtime add table public.calls;
