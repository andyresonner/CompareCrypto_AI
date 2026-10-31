-- Run this in the Supabase SQL editor to create the profiles table.
-- Stores billing plan, trial expiry, alert credits, and referral data per user.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  billing_plan text,
  trial_until bigint,
  alert_credits int not null default 2,
  referral_code text,
  referral_count int not null default 0,
  referral_unlocked boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);
