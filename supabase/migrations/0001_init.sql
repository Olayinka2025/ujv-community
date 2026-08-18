-- UJV Community — initial schema, RLS policies, triggers and reference seed data.
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).

create extension if not exists pgcrypto;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  handle text not null unique,
  role text not null default 'Community member',
  location text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Creates a profile row automatically whenever someone signs up.
-- Reads the display name from auth signUp's `options.data.name`, falling back to the email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_handle text;
  final_handle text;
  suffix int := 0;
begin
  base_handle := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    '[^a-zA-Z0-9]+', '', 'g'
  ));
  if base_handle = '' then
    base_handle := 'member';
  end if;

  final_handle := base_handle;
  while exists (select 1 from public.profiles where handle = final_handle) loop
    suffix := suffix + 1;
    final_handle := base_handle || suffix::text;
  end loop;

  insert into public.profiles (id, name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    final_handle
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SPACES
-- ============================================================
create table public.spaces (
  slug text primary key,
  name text not null,
  tagline text not null,
  category text not null
);

alter table public.spaces enable row level security;

create policy "Spaces are viewable by authenticated users"
  on public.spaces for select to authenticated using (true);

insert into public.spaces (slug, name, tagline, category) values
  ('product-builders', 'Product Builders', 'Ship notes, teardowns and honest feedback on what you''re making.', 'Craft'),
  ('design-lab', 'Design Lab', 'Weekly critique threads, type experiments and interface studies.', 'Craft'),
  ('founders-circle', 'Founders Circle', 'Small, quiet room for early-stage operators. Numbers welcome.', 'Business'),
  ('creator-collabs', 'Creator Collabs', 'Find collaborators, split projects, swap audiences.', 'Collab'),
  ('career-moves', 'Career Moves', 'Roles, referrals and interview debriefs from the community.', 'Growth'),
  ('study-hall', 'Study Hall', 'Accountability check-ins every morning at 7. Show up, log off.', 'Growth');

-- ============================================================
-- SPACE MEMBERS
-- ============================================================
create table public.space_members (
  space_slug text not null references public.spaces (slug) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (space_slug, user_id)
);

alter table public.space_members enable row level security;

create policy "Space memberships are viewable by authenticated users"
  on public.space_members for select to authenticated using (true);
create policy "Users can join spaces"
  on public.space_members for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can leave spaces"
  on public.space_members for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- POSTS
-- ============================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  space_slug text not null references public.spaces (slug) on delete cascade,
  title text not null,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

create index posts_space_slug_idx on public.posts (space_slug);
create index posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

create policy "Posts are viewable by authenticated users"
  on public.posts for select to authenticated using (true);
create policy "Users can create posts as themselves"
  on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "Users can update their own posts"
  on public.posts for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "Users can delete their own posts"
  on public.posts for delete to authenticated using (auth.uid() = author_id);

-- ============================================================
-- POST LIKES
-- ============================================================
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_post_id_idx on public.post_likes (post_id);

alter table public.post_likes enable row level security;

create policy "Post likes are viewable by authenticated users"
  on public.post_likes for select to authenticated using (true);
create policy "Users can like posts"
  on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can unlike posts"
  on public.post_likes for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  host_space_slug text not null references public.spaces (slug) on delete cascade,
  format text not null check (format in ('Online', 'In person')),
  location text not null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Events are viewable by authenticated users"
  on public.events for select to authenticated using (true);

insert into public.events (title, starts_at, host_space_slug, format, location) values
  ('Critique Night: portfolio edition', date_trunc('day', now()) + interval '3 days 18 hours', 'design-lab', 'Online', 'Community stage'),
  ('Founders breakfast, Yaba', date_trunc('day', now()) + interval '5 days 9 hours', 'founders-circle', 'In person', 'Yaba, Lagos'),
  ('Collab speed-matching round 4', date_trunc('day', now()) + interval '8 days 17 hours 30 minutes', 'creator-collabs', 'Online', 'Breakout rooms'),
  ('Study Hall: deep work sprint', date_trunc('day', now()) + interval '1 day 7 hours', 'study-hall', 'Online', 'Quiet room');

-- ============================================================
-- EVENT RSVPS
-- ============================================================
create table public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_rsvps enable row level security;

create policy "Event RSVPs are viewable by authenticated users"
  on public.event_rsvps for select to authenticated using (true);
create policy "Users can RSVP to events"
  on public.event_rsvps for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can cancel their RSVP"
  on public.event_rsvps for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- COURSES
-- ============================================================
create table public.courses (
  slug text primary key,
  title text not null,
  summary text not null,
  instructor_name text not null,
  lessons int not null,
  duration text not null,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced'))
);

alter table public.courses enable row level security;

create policy "Courses are viewable by authenticated users"
  on public.courses for select to authenticated using (true);

insert into public.courses (slug, title, summary, instructor_name, lessons, duration, level) values
  ('starter-course', 'Starter Course: find your first 10 customers', 'The short path from idea to paying customer. Scripts, outreach templates and a one-week plan.', 'Tobi Adeyemi', 8, '1h 40m', 'Beginner'),
  ('interface-craft', 'Interface craft: typography and spacing', 'Type scales, rhythm and the small decisions that separate a rough screen from a finished one.', 'Amara Nwosu', 12, '3h 05m', 'Intermediate'),
  ('story-first-video', 'Story-first video for small teams', 'Plan, shoot and cut a two-minute film with one camera and no crew.', 'Priya Raman', 10, '2h 20m', 'Beginner'),
  ('pricing-that-holds', 'Pricing that holds up', 'Packaging, anchors and raising prices without losing the accounts you want to keep.', 'Sam Mwangi', 6, '1h 10m', 'Advanced');

-- ============================================================
-- COURSE PROGRESS
-- ============================================================
create table public.course_progress (
  course_slug text not null references public.courses (slug) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  progress int not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (course_slug, user_id)
);

alter table public.course_progress enable row level security;

create policy "Users can view their own course progress"
  on public.course_progress for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own course progress"
  on public.course_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own course progress"
  on public.course_progress for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  context text not null default '',
  unread boolean not null default true,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users can mark their own notifications read"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- No insert policy: notifications are only ever created by the trigger functions below
-- (security definer), never directly by a client.

-- ============================================================
-- CONVERSATIONS & MESSAGES (direct messages)
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a <> user_b)
);

-- One conversation per unordered pair of users.
create unique index conversations_pair_idx
  on public.conversations (least(user_a, user_b), greatest(user_a, user_b));

alter table public.conversations enable row level security;

create policy "Users can view their own conversations"
  on public.conversations for select to authenticated
  using (auth.uid() in (user_a, user_b));
create policy "Users can start conversations they're part of"
  on public.conversations for insert to authenticated
  with check (auth.uid() in (user_a, user_b));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)
  ));

create policy "Users can send messages in their conversations"
  on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

-- ============================================================
-- NOTIFICATION TRIGGERS
-- ============================================================
create or replace function public.notify_on_post_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author uuid;
  post_title text;
begin
  select author_id, title into post_author, post_title
  from public.posts where id = new.post_id;

  if post_author is null or post_author = new.user_id then
    return new;
  end if;

  insert into public.notifications (user_id, actor_id, action, context)
  values (post_author, new.user_id, 'liked your post', coalesce(post_title, ''));
  return new;
end;
$$;

create trigger on_post_like_notify
  after insert on public.post_likes
  for each row execute function public.notify_on_post_like();

create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  recipient uuid;
begin
  select case when c.user_a = new.sender_id then c.user_b else c.user_a end
  into recipient
  from public.conversations c
  where c.id = new.conversation_id;

  if recipient is null then
    return new;
  end if;

  insert into public.notifications (user_id, actor_id, action, context)
  values (recipient, new.sender_id, 'sent you a message', left(new.body, 120));
  return new;
end;
$$;

create trigger on_message_notify
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- READ-MODEL VIEWS
-- security_invoker makes these views enforce RLS as the *calling* user
-- (rather than as the view's owner), which is required for them to be safe.
-- ============================================================
create view public.space_feed
with (security_invoker = true) as
select
  s.slug,
  s.name,
  s.tagline,
  s.category,
  (select count(*) from public.space_members m where m.space_slug = s.slug) as member_count,
  (select count(*) from public.posts p where p.space_slug = s.slug) as post_count,
  exists (
    select 1 from public.space_members m
    where m.space_slug = s.slug and m.user_id = auth.uid()
  ) as joined_by_me
from public.spaces s;

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
  ) as liked_by_me
from public.posts p
join public.spaces s on s.slug = p.space_slug
join public.profiles pr on pr.id = p.author_id;

create view public.event_feed
with (security_invoker = true) as
select
  e.id,
  e.title,
  e.starts_at,
  e.format,
  e.location,
  e.host_space_slug,
  s.name as host_name,
  (select count(*) from public.event_rsvps r where r.event_id = e.id) as going_count,
  exists (
    select 1 from public.event_rsvps r
    where r.event_id = e.id and r.user_id = auth.uid()
  ) as going_by_me
from public.events e
join public.spaces s on s.slug = e.host_space_slug;
