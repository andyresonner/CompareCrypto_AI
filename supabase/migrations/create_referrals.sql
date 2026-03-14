-- Run this in the Supabase SQL editor to create the referrals table for tracking referrer counts.
CREATE TABLE IF NOT EXISTS referrals (
  id bigint generated always as identity primary key,
  referrer_code text not null,
  referred_email text not null,
  created_at timestamptz default now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow inserts" ON referrals
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow reads" ON referrals
  FOR SELECT TO anon, authenticated
  USING (true);
