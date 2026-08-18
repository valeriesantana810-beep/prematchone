/*
# Prematch.Bet — secure admin controls

## Summary
Tightens the admin and protected-field access model for the existing Prematch.Bet
schema. Admin checks now use a narrowly scoped server-side helper instead of
self-referencing profile policies. Customer-facing browser writes no longer
include balances, roles, account status, or request status; those values can
only be changed through authenticated, admin-checked database functions.

## Changes
1. Adds `is_prematch_admin()` to check the signed-in caller's role without RLS recursion.
2. Replaces profile, request, and pick admin predicates with that helper.
3. Revokes customer updates to protected profile columns and request status.
4. Adds `admin_set_balance()` and `admin_set_request_status()` functions.
5. Admin functions are executable by authenticated users but reject non-admin callers.
6. No data is deleted or renamed.
*/

CREATE OR REPLACE FUNCTION is_prematch_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_prematch_admin() FROM anon;
GRANT EXECUTE ON FUNCTION is_prematch_admin() TO authenticated;

DROP POLICY IF EXISTS "select_own_or_admin_profiles" ON profiles;
CREATE POLICY "select_own_or_admin_profiles" ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR is_prematch_admin());

DROP POLICY IF EXISTS "update_own_or_admin_profile" ON profiles;
CREATE POLICY "update_own_or_admin_profile" ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR is_prematch_admin())
WITH CHECK (auth.uid() = id OR is_prematch_admin());

DROP POLICY IF EXISTS "select_own_or_admin_requests" ON requests;
CREATE POLICY "select_own_or_admin_requests" ON requests FOR SELECT TO authenticated
USING (auth.uid() = user_id OR is_prematch_admin());

DROP POLICY IF EXISTS "update_own_or_admin_requests" ON requests;
CREATE POLICY "update_own_or_admin_requests" ON requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR is_prematch_admin())
WITH CHECK (auth.uid() = user_id OR is_prematch_admin());

DROP POLICY IF EXISTS "select_own_or_admin_picks" ON picks;
CREATE POLICY "select_own_or_admin_picks" ON picks FOR SELECT TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL OR is_prematch_admin());

DROP POLICY IF EXISTS "update_own_or_admin_picks" ON picks;
CREATE POLICY "update_own_or_admin_picks" ON picks FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR is_prematch_admin())
WITH CHECK (auth.uid() = user_id OR is_prematch_admin());

DROP POLICY IF EXISTS "delete_own_or_admin_picks" ON picks;
CREATE POLICY "delete_own_or_admin_picks" ON picks FOR DELETE TO authenticated
USING (auth.uid() = user_id OR is_prematch_admin());

REVOKE UPDATE (role, balance, account_status) ON profiles FROM authenticated;
REVOKE UPDATE (status) ON requests FROM authenticated;

CREATE OR REPLACE FUNCTION admin_set_balance(p_user_id uuid, p_balance numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_prematch_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_balance IS NULL OR p_balance < 0 OR p_balance > 100000000 THEN
    RAISE EXCEPTION 'Invalid balance';
  END IF;
  UPDATE profiles SET balance = round(p_balance, 2) WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_balance(uuid, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION admin_set_balance(uuid, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION admin_set_request_status(p_request_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_prematch_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('pending', 'confirmed', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'Invalid request status';
  END IF;
  UPDATE requests SET status = p_status WHERE id = p_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_request_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION admin_set_request_status(uuid, text) TO authenticated;
