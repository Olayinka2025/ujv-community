-- UJV Community — call the send-notification-email edge function directly via
-- pg_net, bypassing the Database Webhooks UI (broken on this project: its
-- "supabase_functions" schema is missing). Run this once in the SQL Editor.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_email_on_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://crrcrehtnyhjaorvuhcw.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycmNyZWh0bnloamFvcnZ1aGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzM3NTksImV4cCI6MjEwMjE0OTc1OX0.Lc37dqGJnTBLZAAwFienjMqicfDBE_YPTxFirHHT2qY'
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

create trigger on_notification_email
  after insert on public.notifications
  for each row execute function public.notify_email_on_notification();
