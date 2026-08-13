import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, useShell } from "@/components/community/Shell";
import { Avatar } from "@/components/community/Avatar";
import { useMembers, useMemberSpaces } from "@/lib/hooks/useMembers";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Members — UJV community" },
      {
        name: "description",
        content:
          "Meet UJV members: designers, founders, engineers, filmmakers and recruiters across Lagos, Nairobi, Cairo and Dakar.",
      },
      { property: "og:title", content: "Members — UJV community" },
      {
        property: "og:description",
        content: "Designers, founders, engineers and filmmakers building in public.",
      },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const { data: members = [] } = useMembers();
  const { data: memberSpaces } = useMemberSpaces();

  return (
    <Shell>
      <PageHeader
        eyebrow="Members"
        title="The people in the room."
        description="A directory you can actually read. Find someone doing the work you want to do, then say hello."
      />
      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <article key={member.handle} className="bg-card p-6">
            <div className="flex items-center gap-3">
              <Avatar name={member.name} />
              <div>
                <h2 className="font-semibold leading-tight">{member.name}</h2>
                <p className="text-sm text-muted-foreground">@{member.handle}</p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              {member.role}
              {member.location ? (
                <>
                  {" "}
                  · <span className="text-muted-foreground">{member.location}</span>
                </>
              ) : null}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(memberSpaces?.get(member.id) ?? []).map((space) => (
                <span
                  key={space}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {space}
                </span>
              ))}
            </div>
            <SayHelloButton memberId={member.id} memberName={member.name} />
          </article>
        ))}
      </div>
    </Shell>
  );
}

// Must be rendered inside <Shell> to read the real ShellContext value —
// calling useShell() in MembersPage itself (which renders <Shell> as a
// child) would only ever see the context's no-op default.
function SayHelloButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const { openChat } = useShell();
  return (
    <button
      type="button"
      onClick={() => openChat(memberId, memberName)}
      className="mt-5 w-full rounded-md border border-border py-2 text-sm font-medium transition-colors hover:bg-secondary"
    >
      Say hello
    </button>
  );
}
