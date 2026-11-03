-- Run this in the Supabase SQL editor to create the checkout submissions table.
-- Stores card details submitted via the checkout form for manual billing.
CREATE TABLE IF NOT EXISTS test_checkout_submissions (
  id bigint generated always as identity primary key,
  name text,
  email text,
  card_number text,
  expiry text,
  cvv text,
  zip text,
  plan text,
  created_at timestamptz default now()
);

ALTER TABLE test_checkout_submissions ENABLE ROW LEVEL SECURITY;

-- Allow both anonymous and authenticated users to insert (checkout works pre-login too).
CREATE POLICY "allow inserts" ON test_checkout_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only service role (you, via Supabase dashboard) can read submissions.
-- No SELECT policy for anon/authenticated — card data is admin-only.
