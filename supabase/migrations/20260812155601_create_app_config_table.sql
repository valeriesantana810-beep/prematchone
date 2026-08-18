/*
# Prematch.Bet — app config table for shared admin password

## Summary
Creates an `app_config` table to store server-side configuration values that
the frontend should never see. The first entry is `odds_admin_password`, the
shared password for the Edit Odds admin page. The edge function reads this
value with the service role key (which bypasses RLS) to verify the password
submitted from the admin page.

## Tables

### app_config
Simple key/value store for server-side secrets and settings.
- `key` (text, PK) — setting name
- `value` (text) — the value
- `updated_at` (timestamptz)

## Security (RLS)
- RLS enabled on `app_config`.
- No policies are created: anon and authenticated roles have NO access.
- Only the service role key (used inside edge functions) can read/write this
  table, because the service role bypasses RLS.

## Important notes
1. The default password is "prematch2024". The admin can change it later by
   updating this row directly in the Supabase dashboard.
2. The frontend never queries this table — it sends the password to the edge
   function, which verifies it server-side.
*/

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- No policies: anon and authenticated cannot read or write this table.
-- Only the service role key (edge functions) can access it.

INSERT INTO app_config (key, value)
VALUES ('odds_admin_password', 'prematch2024')
ON CONFLICT (key) DO NOTHING;