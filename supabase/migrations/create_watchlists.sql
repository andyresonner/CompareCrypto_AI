-- Watchlist per user (synced when logged in).
CREATE TABLE IF NOT EXISTS watchlists (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sym text not null,
  name text not null default '',
  added_at timestamptz not null default now(),
  unique(user_id, sym)
);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own watchlist" ON watchlists
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own watchlist" ON watchlists
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own watchlist" ON watchlists
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
