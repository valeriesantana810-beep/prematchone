/*
# Prematch.Bet — core schema (profiles, requests, picks)

## Summary
Creates the three tables that power Prematch.Bet's account dashboard and
request tracking. This is a multi-user app (sign-in required for the dashboard),
so every table is owner-scoped with `auth.uid()` policies. The admin view reads
across all users, which is handled through a `profiles.role` column and
policies that allow admins to read all rows.

## Tables

### profiles
Extends `auth.users` with Prematch.Bet-specific fields.
- `id` (uuid, PK, references auth.users) — one row per user, same id as auth.users
- `name` (text) — full name entered at sign-up
- `phone` (text) — WhatsApp number entered at sign-up
- `username` (text, unique) — the username customers request for the sportsbook
- `account_status` (text, default 'pending') — pending | confirmed | suspended
- `role` (text, default 'user') — user | admin
- `balance` (numeric, default 0) — manually updated by admin for now
- `created_at` (timestamptz)

### requests
A single table for deposits, withdrawals, and registrations. Each row is one
customer request that the admin will mark confirmed/paid.
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles, DEFAULT auth.uid())
- `type` (text) — registration | deposit | withdrawal
- `amount` (numeric, nullable) — null for registrations
- `status` (text, default 'pending') — pending | confirmed | paid | rejected
- `reference` (text, unique) — human-readable reference number (e.g. PB-REQ-XXXXXX)
- `whatsapp_message` (text) — the pre-filled message that was generated
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### picks
Betting picks that a user builds from Today's Odds and sends on WhatsApp.
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles, DEFAULT auth.uid(), nullable — anonymous picks allowed)
- `items` (jsonb) — array of {match, market, selection, odds}
- `stake` (numeric, nullable)
- `status` (text, default 'pending') — pending | sent
- `reference` (text, unique)
- `created_at` (timestamptz)

## Security (RLS)
All tables have RLS enabled.

### profiles
- SELECT: users can read their own profile; admins can read all.
- INSERT: a user can insert only their own profile row (id = auth.uid()).
- UPDATE: users can update their own profile; admins can update any.
  A trigger prevents non-admin users from changing role/balance/account_status.

### requests
- SELECT: users see their own requests; admins see all.
- INSERT: users can insert their own requests.
- UPDATE: users can update their own requests; admins can update any.
- DELETE: users can delete their own pending requests.

### picks
- SELECT: users see their own picks; admins see all. Anonymous picks (null user_id) visible to admin only.
- INSERT: users can insert their own picks (or anon inserts with null user_id).
- UPDATE: users can update their own picks; admins can update any.
- DELETE: users can delete their own picks; admins can delete any.

## Important notes
1. The `profiles.role` and `profiles.balance` columns are admin-controlled.
   A trigger prevents non-admin users from changing these columns directly.
2. Reference numbers are unique and generated client-side with a PB- prefix.
3. Anonymous (not-logged-in) users can create picks from the public front door.
   Those picks have a nullable user_id and are visible only to admins.
4. Admin status is determined by profiles.role = 'admin'. The first admin must
   be set manually in the database.
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  username text UNIQUE,
  account_status text NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending','confirmed','suspended')),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_profiles" ON profiles;
CREATE POLICY "select_own_or_admin_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_or_admin_profile" ON profiles;
CREATE POLICY "update_own_or_admin_profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Trigger: prevent non-admin users from changing role, balance, account_status
CREATE OR REPLACE FUNCTION guard_protected_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT role = 'admin' INTO is_admin FROM profiles WHERE id = auth.uid();
  IF NOT is_admin THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only admins can change the role column';
    END IF;
    IF NEW.balance IS DISTINCT FROM OLD.balance THEN
      RAISE EXCEPTION 'Only admins can change the balance column';
    END IF;
    IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
      RAISE EXCEPTION 'Only admins can change the account_status column';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_columns ON profiles;
CREATE TRIGGER trg_guard_profile_columns
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION guard_protected_profile_columns();

-- ============================================================
-- requests
-- ============================================================
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('registration','deposit','withdrawal')),
  amount numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','rejected')),
  reference text UNIQUE NOT NULL,
  whatsapp_message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(type);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_requests" ON requests;
CREATE POLICY "select_own_or_admin_requests"
ON requests FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "insert_own_requests" ON requests;
CREATE POLICY "insert_own_requests"
ON requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_or_admin_requests" ON requests;
CREATE POLICY "update_own_or_admin_requests"
ON requests FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "delete_own_requests" ON requests;
CREATE POLICY "delete_own_requests"
ON requests FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- picks
-- ============================================================
CREATE TABLE IF NOT EXISTS picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]',
  stake numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent')),
  reference text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_picks_user_id ON picks(user_id);
CREATE INDEX IF NOT EXISTS idx_picks_status ON picks(status);

ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_picks" ON picks;
CREATE POLICY "select_own_or_admin_picks"
ON picks FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR user_id IS NULL
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "insert_own_or_anon_picks" ON picks;
CREATE POLICY "insert_own_or_anon_picks"
ON picks FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NULL OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "update_own_or_admin_picks" ON picks;
CREATE POLICY "update_own_or_admin_picks"
ON picks FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "delete_own_or_admin_picks" ON picks;
CREATE POLICY "delete_own_or_admin_picks"
ON picks FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- updated_at trigger for requests
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_requests_updated_at ON requests;
CREATE TRIGGER trg_requests_updated_at
BEFORE UPDATE ON requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
