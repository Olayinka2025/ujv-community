import { Link, useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { CallOverlay } from "./CallOverlay";
import { useTheme } from "@/lib/client-prefs";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { useMembers } from "@/lib/hooks/useMembers";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { useMarkNotificationsRead, useNotifications } from "@/lib/hooks/useNotifications";
import {
  useConversations,
  useMessages,
  useOrCreateConversation,
  useSendMessage,
} from "@/lib/hooks/useChat";
import { useStartCall } from "@/lib/hooks/useCalls";
import {
  ArrowLeft,
  Bell,
  Grid3x3,
  Home,
  LogOut,
  Megaphone,
  Moon,
  Phone,
  Search,
  Send,
  Sun,
  X,
  ChevronsUpDown,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  Video,
} from "lucide-react";

type ShellContextValue = { openChat: (userId?: string, name?: string) => void };
const ShellContext = createContext<ShellContextValue>({ openChat: () => {} });
export const useShell = () => useContext(ShellContext);

const tabs = [
  { to: "/", label: "Discussion" },
  { to: "/courses", label: "Courses" },
  { to: "/spaces", label: "Spaces" },
  { to: "/events", label: "Events" },
  { to: "/members", label: "Members" },
] as const;

const sidebar = [
  { to: "/", label: "Home", icon: Home },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/spaces", label: "Announcements", icon: Megaphone },
] as const;

function IconButton({
  children,
  label,
  onClick,
  badge,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
      {badge ? (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { data: members = [] } = useMembers();
  const { data: spaces = [] } = useSpaces();
  const { openChat } = useShell();

  const trimmed = query.trim().toLowerCase();
  const matchedMembers = trimmed
    ? members.filter((member) => member.name.toLowerCase().includes(trimmed)).slice(0, 4)
    : [];
  const matchedSpaces = trimmed
    ? spaces.filter((space) => space.name.toLowerCase().includes(trimmed)).slice(0, 4)
    : [];
  const showResults = focused && trimmed.length > 0;

  return (
    <div className="relative mx-auto hidden w-full max-w-xl md:block">
      <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search members and spaces"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {showResults ? (
        <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lift)]">
          {matchedMembers.length === 0 && matchedSpaces.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No matches.</p>
          ) : null}
          {matchedMembers.length > 0 ? (
            <div className="border-b border-border p-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Members
              </p>
              {matchedMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    openChat(member.id, member.name);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Avatar name={member.name} size={24} /> {member.name}
                </button>
              ))}
            </div>
          ) : null}
          {matchedSpaces.length > 0 ? (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Spaces
              </p>
              {matchedSpaces.map((space) => (
                <Link
                  key={space.slug}
                  to="/spaces/$slug"
                  params={{ slug: space.slug }}
                  onClick={() => setQuery("")}
                  className="block rounded-md px-2 py-2 text-sm hover:bg-secondary"
                >
                  {space.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => item.unread).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <IconButton label="Notifications" badge={unread} onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
      </IconButton>
      {open ? (
        <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              onClick={() => markRead.mutate()}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing yet.</li>
            ) : null}
            {items.map((item) => (
              <li
                key={item.id}
                className={
                  item.unread ? "flex gap-3 bg-secondary/60 px-4 py-3" : "flex gap-3 px-4 py-3"
                }
              >
                <Avatar name={item.actor?.name ?? "UJV"} size={32} />
                <div className="min-w-0 text-sm">
                  <p className="leading-snug">
                    <span className="font-semibold">{item.actor?.name ?? "UJV"}</span> {item.action}
                  </p>
                  <p className="truncate text-muted-foreground">{item.context}</p>
                </div>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {timeAgo(item.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ChatPanel({
  open,
  onClose,
  guestUserId,
  guestName,
}: {
  open: boolean;
  onClose: () => void;
  guestUserId?: string | null;
  guestName?: string | null;
}) {
  const { user } = useAuth();
  const { data: conversations = [] } = useConversations();
  const orCreate = useOrCreateConversation();
  const sendMessage = useSendMessage();
  const startCall = useStartCall();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const activeConversation = conversations.find((thread) => thread.id === activeId);

  const call = (kind: "audio" | "video") => {
    if (!activeId || !activeConversation || startCall.isPending) return;
    startCall.mutate(
      { conversationId: activeId, calleeId: activeConversation.otherUserId, kind },
      {
        onError: () =>
          toast.error(`Couldn't start the ${kind === "audio" ? "voice" : "video"} call.`),
      },
    );
  };

  useEffect(() => {
    if (!open || !guestUserId) return;
    // Only auto-select when opened for a specific person (e.g. "Say hello").
    // Opening chat generically should always land on the thread list — and
    // must NOT reactively re-select a conversation on every background
    // refetch of `conversations`, or it can silently yank the user back out
    // of whatever thread they just tapped into.
    const existing = conversations.find((thread) => thread.otherUserId === guestUserId);
    if (existing) {
      setActiveId(existing.id);
    } else if (!orCreate.isPending) {
      orCreate.mutate(guestUserId, { onSuccess: (id) => setActiveId(id) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guestUserId, conversations]);

  const { data: messages = [] } = useMessages(activeId);
  const activeName = activeConversation?.otherName ?? guestName ?? "Conversation";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/25" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-3xl bg-card shadow-[var(--shadow-lift)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Thread list */}
        <div
          className={
            activeId
              ? "hidden w-full shrink-0 flex-col border-r border-border sm:flex sm:w-72"
              : "flex w-full shrink-0 flex-col border-r border-border sm:w-72"
          }
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <p className="font-display text-base font-semibold">Chat</p>
            <button
              type="button"
              aria-label="Close chat"
              onClick={onClose}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No conversations yet.
              </li>
            ) : null}
            {conversations.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(thread.id)}
                  className={
                    thread.id === activeId
                      ? "flex w-full items-center gap-3 bg-secondary px-4 py-3 text-left"
                      : "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60"
                  }
                >
                  <Avatar name={thread.otherName} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {thread.otherName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {thread.lastMessageBody ?? "No messages yet"}
                    </p>
                  </div>
                  {thread.lastMessageAt ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(thread.lastMessageAt)}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Active thread */}
        <div className={activeId ? "flex w-full flex-col" : "hidden w-full flex-col sm:flex"}>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <button
              type="button"
              aria-label="Back to conversations"
              onClick={() => setActiveId(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {activeId ? <Avatar name={activeName} size={30} /> : null}
            <p className="truncate font-display text-base font-semibold">
              {activeId ? activeName : "Select a conversation"}
            </p>
            {activeId ? (
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Start voice call"
                  disabled={startCall.isPending}
                  onClick={() => call("audio")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Start video call"
                  disabled={startCall.isPending}
                  onClick={() => call("video")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  <Video className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              aria-label="Close chat"
              onClick={onClose}
              className={
                activeId
                  ? "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  : "ml-auto flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              }
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.sender_id === user?.id ? "flex justify-end" : "flex items-end gap-2"
                }
              >
                {message.sender_id !== user?.id ? <Avatar name={activeName} size={28} /> : null}
                <p
                  className={
                    message.sender_id === user?.id
                      ? "max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                      : "max-w-[75%] rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm text-secondary-foreground"
                  }
                >
                  {message.body}
                </p>
              </div>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              const text = draft.trim();
              if (!text || !activeId) return;
              sendMessage.mutate({ conversationId: activeId, body: text });
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Message ${activeName}`}
              disabled={!activeId}
              className="w-full rounded-full bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!activeId}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatGuestId, setChatGuestId] = useState<string | null>(null);
  const [chatGuestName, setChatGuestName] = useState<string | null>(null);
  const { data: notifications = [] } = useNotifications();
  const chatUnread = notifications.filter(
    (item) => item.unread && item.action === "sent you a message",
  ).length;
  const { theme, toggle } = useTheme();
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName = profile?.name ?? user?.email ?? "Member";

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  const openChat = (userId?: string, name?: string) => {
    setChatGuestId(userId ?? null);
    setChatGuestName(name ?? null);
    setChatOpen(true);
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-surface" />;
  }

  return (
    <ShellContext.Provider value={{ openChat }}>
      <div className="min-h-screen bg-surface text-foreground">
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-16 items-center gap-4 px-4">
            <Link
              to="/"
              aria-label="Home"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Home className="h-5 w-5" />
            </Link>
            <Link to="/" className="flex min-w-0 items-center gap-2 border-l border-border pl-4">
              <Logo size={34} />
              <span className="truncate font-display text-base font-semibold sm:text-lg">
                UJV Community
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
            <HeaderSearch />
            <div className="ml-auto flex items-center gap-1">
              <IconButton
                label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={toggle}
              >
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </IconButton>
              <IconButton label="Apps">
                <Grid3x3 className="h-5 w-5" />
              </IconButton>
              <IconButton label="Messages" badge={chatUnread} onClick={() => openChat()}>
                <MessageCircle className="h-5 w-5" />
              </IconButton>
              <NotificationsMenu />
              <Avatar name={displayName} size={34} />
              <IconButton
                label="Sign out"
                onClick={() => {
                  void signOut();
                }}
              >
                <LogOut className="h-5 w-5" />
              </IconButton>
            </div>
          </div>
        </header>

        <div className="flex">
          <nav className="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-border bg-card py-5 lg:flex">
            <Link
              to="/"
              aria-label="UJV Community"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"
            >
              <Logo size={26} />
            </Link>
            {["J", "V"].map((label) => (
              <span
                key={label}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary font-display text-sm font-semibold text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </nav>

          <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-4 md:block">
            <ul className="space-y-1">
              {sidebar.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    activeProps={{
                      className: "bg-primary text-primary-foreground hover:bg-primary/90",
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              ))}
              {profile?.is_admin ? (
                <li>
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    activeProps={{
                      className: "bg-primary text-primary-foreground hover:bg-primary/90",
                    }}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    Admin
                  </Link>
                </li>
              ) : null}
            </ul>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="border-b border-border bg-card px-4">
              <div className="flex items-center gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    activeOptions={{ exact: tab.to === "/" }}
                    className="shrink-0 border-b-2 border-transparent px-4 py-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    activeProps={{ className: "border-primary text-foreground" }}
                  >
                    {tab.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => openChat()}
                  className="ml-auto hidden shrink-0 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:block"
                >
                  Chat
                </button>
              </div>
            </div>
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          </div>
        </div>

        <ChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          guestUserId={chatGuestId}
          guestName={chatGuestName}
        />
        <CallOverlay />
      </div>
    </ShellContext.Provider>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
