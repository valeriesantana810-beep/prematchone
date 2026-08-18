-- Install pg_net (needed for HTTP calls from cron) and pg_cron
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- Add commence_time column to fixtures (full ISO timestamp from the odds API)
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS commence_time timestamptz;

-- Backfill existing rows with today's date + their kickoff_time as a reasonable default
UPDATE fixtures
SET commence_time = (now() AT TIME ZONE 'Africa/Windhoek')::date + (kickoff_time || ':00')::time
WHERE commence_time IS NULL;
