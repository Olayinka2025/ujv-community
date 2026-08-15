-- UJV Community — comments, admin roles, chat list view.
-- Run this once in the Supabase SQL Editor, same as 0001_init.sql.

-- ============================================================
-- COMMENTS
-- ============================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create policy "Comments are viewable by authenticated users"
  on public.comments for select to authenticated using (true);
create policy "Users can comment as themselves"
  on public.comments for insert to authenticated with check (auth.uid() = author_id);

-- ============================================================
-- ADMIN ROLE
-- ============================================================
alter table public.profiles add column is_admin boolean not null default false;

-- Prevent self-promotion: only allow authenticated users to update the columns
-- that were already editable before is_admin existed. RLS alone isn't enough
-- here — a row-level "update own profile" policy would otherwise let a user
-- set their own is_admin to true.
revoke update on public.profiles from authenticated;
grant update (name, role, location) on public.profiles to authenticated;

update public.profiles set is_admin = true where handle in ('stephen', 'emmanuelolayanju');

-- Admin write access on the reference tables (adds to, not replacing, the
-- existing "viewable by authenticated users" select policies).
create policy "Admins can insert spaces"
  on public.spaces for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
create policy "Admins can update spaces"
  on public.spaces for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
create policy "Admins can delete spaces"
  on public.spaces for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

create policy "Admins can insert events"
  on public.events for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
create policy "Admins can update events"
  on public.events for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
create policy "Admins can delete events"
  on public.events for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

create policy "Admins can insert courses"
  on public.courses for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
create policy "Admins can update courses"
  on public.courses for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
create policy "Admins can delete courses"
  on public.courses for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ============================================================
-- UPDATED VIEWS
-- ============================================================

-- post_feed: add comment_count. Views can't be ALTERed to add columns, so
-- drop and recreate exactly as in 0001_init.sql plus the new column.
drop view public.post_feed;

create view public.post_feed
with (security_invoker = true) as
select
  p.id,
  p.title,
  p.body,
  p.image_url,
  p.created_at,
  p.space_slug,
  s.name as space_name,
  p.author_id,
  pr.name as author_name,
  pr.role as author_role,
  (select count(*) from public.post_likes l where l.post_id = p.id) as like_count,
  exists (
    select 1 from public.post_likes l
    where l.post_id = p.id and l.user_id = auth.uid()
  ) as liked_by_me,
  (select count(*) from public.comments c where c.post_id = p.id) as comment_count
from public.posts p
join public.spaces s on s.slug = p.space_slug
join public.profiles pr on pr.id = p.author_id;

-- conversation_feed: conversation list with the other participant and a
-- last-message preview, for the redesigned chat list.
create view public.conversation_feed
with (security_invoker = true) as
select
  c.id,
  c.created_at,
  case when c.user_a = auth.uid() then c.user_b else c.user_a end as other_user_id,
  case when c.user_a = auth.uid() then pb.name else pa.name end as other_user_name,
  (
    select m.body from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc limit 1
  ) as last_message_body,
  (
    select m.created_at from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc limit 1
  ) as last_message_at
from public.conversations c
join public.profiles pa on pa.id = c.user_a
join public.profiles pb on pb.id = c.user_b
where auth.uid() in (c.user_a, c.user_b);
