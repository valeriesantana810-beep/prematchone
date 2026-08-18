/*
# Prematch.Bet — add source column, NPL seed, and pg_cron schedule

## Summary
1. Adds a source column to fixtures to distinguish API-synced fixtures
   from manually entered ones. This protects manual fixtures (like
   Namibia Premier League) from being overwritten by the scheduled
   API sync job.
2. Seeds Namibia Premier League (NPL) fixtures as manual entries.
3. Sets existing seeded fixtures to source = api (they will be refreshed
   by the sync edge function).
4. Enables pg_cron and pg_net extensions for scheduled HTTP calls.
5. Creates a cron schedule that calls the sync-odds edge function every
   thirty minutes. The edge function fetches from The Odds API and updates
   only API-sourced fixtures, leaving manual fixtures untouched.

## Changes
### fixtures table
- New column: source text NOT NULL DEFAULT manual
- Existing rows updated to source = api (they came from the API leagues)

### Seed data
- 3 NPL fixtures (source = manual) so the NPL tab is populated immediately

### Extensions
- pg_cron: enables scheduled jobs inside Postgres
- pg_net: enables HTTP requests from Postgres

### Cron schedule
- Job name: sync-odds-every-30-min
- Schedule: every thirty minutes
- Calls: the sync-odds edge function via HTTP POST

## Security
- No RLS policy changes. The source column is readable by the public.
- The cron job runs as the postgres user and calls the edge function URL
  with the anon key header (the edge function does not require JWT).

## Important notes
1. The sync-odds edge function only touches fixtures where source = api.
   Manual fixtures (NPL, or anything the admin adds manually) are never
   overwritten by the sync.
2. If the API call fails, the edge function returns gracefully without
   modifying any rows — the public page continues showing the last
   successfully synced data.
3. The admin Edit Odds page can still edit ALL fixtures. When the admin
   saves, the source column is preserved.
*/

-- Add source column
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- Mark existing seeded API-league fixtures as 'api'
UPDATE fixtures SET source = 'api' WHERE league IN ('epl', 'laliga', 'seriea', 'ucl');

-- Seed Namibia Premier League (manual — no API source)
INSERT INTO fixtures (league, league_name, home_team, away_team, kickoff_time, market, home_odds, draw_odds, away_odds, sort_order, is_active, source)
VALUES
  ('npl', 'Namibia Premier League', 'African Stars', 'Orlando Pirates', '15:00', 'Match Result', 2.20, 3.10, 3.00, 1, true, 'manual'),
  ('npl', 'Namibia Premier League', 'Blue Waters', 'Young Chiefs', '17:00', 'Match Result', 1.95, 3.20, 3.60, 2, true, 'manual'),
  ('npl', 'Namibia Premier League', 'Tura Magic', 'United Africa', '19:00', 'Match Result', 2.50, 3.00, 2.70, 3, true, 'manual')
ON CONFLICT DO NOTHING;

-- Enable pg_cron and pg_net for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the sync-odds edge function to run every thirty minutes
SELECT cron.schedule(
  'sync-odds-every-30-min',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://wgyznrgcucmtgpteghrr.supabase.co/functions/v1/sync-odds',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);