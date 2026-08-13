export type Profile = {
  id: string;
  name: string;
  handle: string;
  role: string;
  location: string | null;
  created_at: string;
};

export type SpaceFeed = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  member_count: number;
  post_count: number;
  joined_by_me: boolean;
};

export type PostFeed = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  space_slug: string;
  space_name: string;
  author_id: string;
  author_name: string;
  author_role: string;
  like_count: number;
  liked_by_me: boolean;
};

export type EventFeed = {
  id: string;
  title: string;
  starts_at: string;
  format: "Online" | "In person";
  location: string;
  host_space_slug: string;
  host_name: string;
  going_count: number;
  going_by_me: boolean;
};

export type Course = {
  slug: string;
  title: string;
  summary: string;
  instructor_name: string;
  lessons: number;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
};

export type CourseProgress = {
  course_slug: string;
  user_id: string;
  progress: number;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  action: string;
  context: string;
  unread: boolean;
  created_at: string;
  actor: { name: string } | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  otherUserId: string;
  otherName: string;
};
