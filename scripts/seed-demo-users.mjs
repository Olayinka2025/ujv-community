// One-time local script: creates the original 8 demo people as real Supabase Auth
// users, then seeds posts, space memberships, some likes, event RSVPs, course
// progress and a sample conversation so the app isn't empty on first load.
//
// Run with:  node --env-file=.env scripts/seed-demo-users.mjs
//
// Safe to re-run: existing demo users are detected by email and reused, and
// every insert uses upsert/ignore-duplicate semantics.

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  console.error("Run this with: node --env-file=.env scripts/seed-demo-users.mjs");
  process.exit(1);
}

const DEMO_PASSWORD = "Demo12345!";

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const people = [
  {
    name: "Amara Nwosu",
    email: "amara@ujv.demo",
    role: "Product designer",
    location: "Lagos",
    spaces: ["design-lab", "product-builders"],
  },
  {
    name: "Tobi Adeyemi",
    email: "tobi@ujv.demo",
    role: "Indie founder",
    location: "Abuja",
    spaces: ["founders-circle"],
  },
  {
    name: "Priya Raman",
    email: "priya@ujv.demo",
    role: "Filmmaker",
    location: "Nairobi",
    spaces: ["creator-collabs", "study-hall"],
  },
  {
    name: "Daniel Okoro",
    email: "daniel@ujv.demo",
    role: "Engineer",
    location: "Remote",
    spaces: ["product-builders"],
  },
  {
    name: "Leila Haddad",
    email: "leila@ujv.demo",
    role: "Recruiter",
    location: "Cairo",
    spaces: ["career-moves"],
  },
  {
    name: "Sam Mwangi",
    email: "sam@ujv.demo",
    role: "Growth lead",
    location: "Nairobi",
    spaces: ["career-moves", "founders-circle"],
  },
  {
    name: "Ife Bello",
    email: "ife@ujv.demo",
    role: "Illustrator",
    location: "Lagos",
    spaces: ["design-lab", "creator-collabs"],
  },
  {
    name: "Nadia Cisse",
    email: "nadia@ujv.demo",
    role: "Community manager",
    location: "Dakar",
    spaces: ["study-hall", "design-lab"],
  },
];

const posts = [
  {
    author: "Amara Nwosu",
    space: "design-lab",
    title: "Killed our onboarding carousel and retention went up",
    body: "Replaced four swipe screens with one question: what are you here to do? Day-7 return jumped 11%. Posting the before/after frames in the thread if anyone wants to pull them apart.",
    likedBy: ["Tobi Adeyemi", "Priya Raman", "Ife Bello"],
  },
  {
    author: "Tobi Adeyemi",
    space: "founders-circle",
    title: "Month 9 numbers, warts and all",
    body: "MRR $4.2k, churn 6.1%, one support person (me). The scary line is that 62% of revenue sits with three accounts. Working on that this quarter.",
    likedBy: ["Sam Mwangi", "Amara Nwosu"],
  },
  {
    author: "Priya Raman",
    space: "creator-collabs",
    title: "Looking for an editor for a 6-part doc series",
    body: "Shot across Lagos and Nairobi, roughly 40 hours of footage. Paid, remote, starts in two weeks. Reply with a reel and your rate.",
    likedBy: ["Ife Bello"],
  },
  {
    author: "Daniel Okoro",
    space: "product-builders",
    title: "Teardown: how three apps handle empty states",
    body: "Screens from Linear, Notion and Things. The pattern that keeps winning is a single action plus a real example — never an illustration alone.",
    likedBy: ["Amara Nwosu", "Nadia Cisse"],
  },
  {
    author: "Leila Haddad",
    space: "career-moves",
    title: "Seven roles from members this week",
    body: "Two design, three engineering, one ops, one growth. All remote-friendly, all with named hiring managers in the thread. Referrals get read first.",
    likedBy: ["Sam Mwangi"],
  },
];

const courseProgress = [
  { name: "Amara Nwosu", course: "starter-course", progress: 62 },
  { name: "Daniel Okoro", course: "interface-craft", progress: 25 },
  { name: "Sam Mwangi", course: "pricing-that-holds", progress: 100 },
];

async function findOrCreateUser(person) {
  const { data: page1, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw listError;
  const existing = page1.users.find((u) => u.email === person.email);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email: person.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: person.name },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  console.log("Creating demo accounts…");
  const ids = new Map();
  for (const person of people) {
    const id = await findOrCreateUser(person);
    ids.set(person.name, id);
    console.log(`  ${person.name} -> ${person.email}`);
  }

  console.log("Joining spaces…");
  const membershipRows = people.flatMap((person) =>
    person.spaces.map((slug) => ({ space_slug: slug, user_id: ids.get(person.name) })),
  );
  {
    const { error } = await supabase.from("space_members").upsert(membershipRows, {
      onConflict: "space_slug,user_id",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  console.log("Creating posts…");
  const postIds = new Map();
  for (const post of posts) {
    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("title", post.title)
      .maybeSingle();
    if (existing) {
      postIds.set(post.title, existing.id);
      continue;
    }
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: ids.get(post.author),
        space_slug: post.space,
        title: post.title,
        body: post.body,
      })
      .select("id")
      .single();
    if (error) throw error;
    postIds.set(post.title, data.id);
  }

  console.log("Adding likes…");
  const likeRows = posts.flatMap((post) =>
    post.likedBy.map((liker) => ({ post_id: postIds.get(post.title), user_id: ids.get(liker) })),
  );
  {
    const { error } = await supabase.from("post_likes").upsert(likeRows, {
      onConflict: "post_id,user_id",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  console.log("RSVPing to events…");
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, host_space_slug");
  if (eventsError) throw eventsError;
  const rsvpRows = [];
  for (const event of events ?? []) {
    for (const person of people) {
      if (person.spaces.includes(event.host_space_slug)) {
        rsvpRows.push({ event_id: event.id, user_id: ids.get(person.name) });
      }
    }
  }
  if (rsvpRows.length > 0) {
    const { error } = await supabase.from("event_rsvps").upsert(rsvpRows, {
      onConflict: "event_id,user_id",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  console.log("Setting course progress…");
  for (const row of courseProgress) {
    const { error } = await supabase.from("course_progress").upsert({
      course_slug: row.course,
      user_id: ids.get(row.name),
      progress: row.progress,
    });
    if (error) throw error;
  }

  console.log("Starting a sample conversation…");
  {
    const userA = ids.get("Amara Nwosu");
    const userB = ids.get("Tobi Adeyemi");
    const { data: existingConvo } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`)
      .maybeSingle();

    let conversationId = existingConvo?.id;
    if (!conversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_a: userA, user_b: userB })
        .select("id")
        .single();
      if (error) throw error;
      conversationId = data.id;

      await supabase.from("messages").insert([
        {
          conversation_id: conversationId,
          sender_id: userA,
          body: "Morning — did the retention chart land?",
        },
        {
          conversation_id: conversationId,
          sender_id: userB,
          body: "It did. Day-7 is holding at 11% up.",
        },
      ]);
    }
  }

  console.log("\nDone. Demo accounts (password for all: %s):", DEMO_PASSWORD);
  for (const person of people) {
    console.log(`  ${person.email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
