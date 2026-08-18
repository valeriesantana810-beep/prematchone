/*
# Prematch.Bet — fixtures table for admin-editable odds

## Summary
Creates a `fixtures` table that stores today's fixtures and odds, replacing the
hardcoded odds data in the frontend. The public odds page reads from this table
live. An admin "Edit Odds" page updates rows through an edge function that
verifies a shared password (stored as a Supabase secret), keeping writes
server-side so the anon-key client cannot modify fixtures directly.

## Tables

### fixtures
One row per fixture (match) shown on the public odds page.
- `id` (uuid, PK)
- `league` (text) — league id matching the frontend league tabs: epl | laliga | seriea | ucl
- `league_name` (text) — display name of the league (e.g. "Premier League")
- `home_team` (text) — home team name
- `away_team` (text) — away team name
- `kickoff_time` (text) — display-only time string, e.g. "15:00"
- `market` (text) — market label, e.g. "Match Result"
- `home_odds` (numeric) — odds for home win
- `draw_odds` (numeric) — odds for a draw
- `away_odds` (numeric) — odds for away win
- `sort_order` (int, default 0) — controls display order within a league
- `is_active` (boolean, default true) — if false, fixture is hidden from the public page
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security (RLS)
- RLS enabled on `fixtures`.
- SELECT: public (anon + authenticated) — the odds page must read without login.
- INSERT / UPDATE / DELETE: denied for anon and authenticated roles. All writes go
  through the `admin-update-fixtures` edge function, which uses the service role key
  and verifies a shared password before upserting.

## Important notes
1. The edge function reads the password from the `ODDS_ADMIN_PASSWORD` Supabase
   secret. The secret is set via the Supabase dashboard or MCP — NOT in the .env
   the frontend sees.
2. Seed data is inserted by a follow-up migration so the public page is populated
   immediately.
3. The frontend reads fixtures with the anon key; no login required to view odds.
*/ 

CREATE TABLE IF NOT EXISTS fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league text NOT NULL,
  league_name text NOT NULL,
  home_team text NOT NULL,
  away_team text NOT NULL,
  kickoff_time text NOT NULL DEFAULT '',
  market text NOT NULL DEFAULT 'Match Result',
  home_odds numeric(6,2) NOT NULL DEFAULT 2.00,
  draw_odds numeric(6,2) NOT NULL DEFAULT 3.00,
  away_odds numeric(6,2) NOT NULL DEFAULT 3.00,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fixtures_league ON fixtures(league);
CREATE INDEX IF NOT EXISTS idx_fixtures_active ON fixtures(is_active);

ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_fixtures" ON fixtures;
CREATE POLICY "public_read_fixtures"
ON fixtures FOR SELECT
TO anon, authenticated
USING (true);

-- No INSERT / UPDATE / DELETE policies: writes are denied by default RLS.
-- All fixture writes go through the admin-update-fixtures edge function
-- which uses the service role key (bypasses RLS) after password verification.

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_fixtures_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fixtures_updated_at ON fixtures;
CREATE TRIGGER trg_fixtures_updated_at
BEFORE UPDATE ON fixtures
FOR EACH ROW
EXECUTE FUNCTION set_fixtures_updated_at();