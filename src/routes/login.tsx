import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/community/Logo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — UJV Community" },
      {
        name: "description",
        content:
          "Sign in to the UJV Community to join the discussion, take courses, join spaces and meet members.",
      },
      { property: "og:title", content: "Sign in — UJV Community" },
      {
        property: "og:description",
        content: "Enter the UJV Community: discussion, courses, spaces and events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-background px-6 py-14">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={44} />
            <span className="font-display text-xl font-semibold">UJV Community</span>
          </Link>

          {confirmationSent ? (
            <>
              <h1 className="mt-10 text-3xl font-semibold">Check your email.</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
                Click it to activate your account, then come back and sign in.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmationSent(false);
                  setMode("signin");
                }}
                className="mt-8 w-full rounded-md border border-border py-3 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <h1 className="mt-10 text-3xl font-semibold">
                {mode === "signin" ? "Welcome back." : "Join the community."}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to pick up the discussion, your courses and your spaces."
                  : "Create your member profile and step into the room."}
              </p>

              <form
                className="mt-8 space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!email.trim() || !password.trim() || (mode === "signup" && !name.trim())) {
                    setError("Please fill in every field.");
                    return;
                  }
                  setError("");
                  setSubmitting(true);
                  const result =
                    mode === "signup"
                      ? await signUp(name.trim(), email.trim(), password)
                      : await signIn(email.trim(), password);
                  setSubmitting(false);
                  if (result.error) {
                    setError(result.error);
                    return;
                  }
                  if (
                    mode === "signup" &&
                    "needsConfirmation" in result &&
                    result.needsConfirmation
                  ) {
                    setConfirmationSent(true);
                    return;
                  }
                  navigate({ to: "/" });
                }}
              >
                {mode === "signup" ? (
                  <label className="block">
                    <span className="text-sm font-medium">Full name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Amara Nwosu"
                      className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@studio.com"
                    className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
                  />
                </label>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting
                    ? "One moment…"
                    : mode === "signin"
                      ? "Enter the community"
                      : "Create account"}
                </button>
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                {mode === "signin" ? "New here?" : "Already a member?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMode(mode === "signin" ? "signup" : "signin");
                  }}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  {mode === "signin" ? "Request an invite" : "Sign in instead"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <aside className="hidden flex-col justify-between bg-[image:var(--gradient-cover)] p-12 text-primary-foreground lg:flex">
        <Logo size={64} />
        <div>
          <p className="font-display text-3xl font-semibold leading-snug">
            A quiet room for designers, founders and makers.
          </p>
          <p className="mt-4 max-w-md leading-relaxed opacity-80">
            Weekly events, short courses you can finish in an afternoon, and a feed worth reading.
          </p>
        </div>
        <p className="text-sm opacity-70">UJV Community</p>
      </aside>
    </div>
  );
}
