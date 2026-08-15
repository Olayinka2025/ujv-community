// Supabase Edge Function: send-notification-email
// Triggered by a Database Webhook on INSERT to public.notifications.
// Looks up the recipient's email (via the auto-injected service-role client,
// so email never has to be exposed through the public profiles table) and
// sends a short notification email through Resend.
//
// Deploy via the Supabase Dashboard: Edge Functions -> Deploy a new function
// -> name it "send-notification-email" -> paste this file's contents.
// Then add RESEND_API_KEY as an Edge Function secret, and create a Database
// Webhook (Database -> Webhooks) on notifications INSERT targeting this
// function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://ujv-community.netlify.app";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload?.record;
    if (!record?.user_id) {
      return new Response("ignored: no record.user_id", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      record.user_id,
    );
    const recipientEmail = userData?.user?.email;
    if (userError || !recipientEmail) {
      return new Response("ignored: no recipient email", { status: 200 });
    }

    let actorName = "Someone";
    if (record.actor_id) {
      const { data: actor } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", record.actor_id)
        .single();
      if (actor?.name) actorName = actor.name;
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response("RESEND_API_KEY not configured", { status: 500 });
    }

    const contextLine = record.context ? ` — "${record.context}"` : "";
    const subject = `${actorName} ${record.action}`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UJV Community <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html: `
          <p><strong>${actorName}</strong> ${record.action}${contextLine}</p>
          <p><a href="${SITE_URL}">Open UJV Community</a></p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error("Resend error:", text);
      return new Response(text, { status: 500 });
    }

    return new Response("sent", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
});
