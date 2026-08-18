-- Create a scheduled job to call the sync-odds edge function every 30 minutes
SELECT cron.schedule(
  'sync-odds-every-30-min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wgyznrgcucmtgpteghrr.supabase.co/functions/v1/sync-odds',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
