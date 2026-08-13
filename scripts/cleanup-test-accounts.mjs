// Deletes throwaway accounts (testN@example.com / debug*@example.com) created
// by local smoke-testing. Deleting the auth user cascades to their profile,
// posts, likes, memberships, RSVPs, course progress and conversations.
//
// Run with:  node --env-file=.env scripts/cleanup-test-accounts.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
if (error) throw error;

const toDelete = data.users.filter((u) =>
  /^(test|debug|dbg|prodcheck)[a-z0-9]*@example\.com$/i.test(u.email ?? ""),
);

console.log(`Deleting ${toDelete.length} test/debug accounts:`);
for (const user of toDelete) {
  console.log(`  ${user.email}`);
  const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
  if (delError) console.error(`    FAILED: ${delError.message}`);
}
console.log("Done.");
