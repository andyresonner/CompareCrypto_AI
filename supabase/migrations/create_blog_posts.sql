-- Blog posts table — managed via the admin portal.
-- Replaces hardcoded IntelArticlePage articles in app.js.
CREATE TABLE IF NOT EXISTS blog_posts (
  id bigint generated always as identity primary key,
  slug text unique not null,
  title text not null,
  deck text,
  sponsor text,
  hero_image text,
  stats jsonb default '[]'::jsonb,
  sections jsonb default '[]'::jsonb,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can read published posts only.
CREATE POLICY "public read published" ON blog_posts
  FOR SELECT TO anon, authenticated
  USING (published = true);

-- Seed the 3 existing hardcoded articles.
INSERT INTO blog_posts (slug, title, deck, sponsor, hero_image, stats, sections, published) VALUES
(
  'how-to-research-altcoins',
  'How To Research Altcoins Before You Buy',
  'A practical survival framework for filtering noise, avoiding weak launches, and focusing on projects that can actually last.',
  'Sponsored Research by Binance',
  '/intel/cards/how-to-research-altcoins.png',
  '[{"k":"Failure reality","v":"Most new tokens fail"},{"k":"Default stance","v":"Assume zero until proven otherwise"},{"k":"Primary edge","v":"Discipline beats hype"}]',
  '[{"h":"1) Start With Survival, Not Hype","p":"Treat every new altcoin as guilty until proven innocent. Most launches are short-lived, so your first job is filtering for durability.","bullets":["Prefer assets that have traded through at least 12–18 months of real market conditions.","Prioritize listings on liquid, reputable venues over micro-only listings.","Use position sizing that is tiny relative to daily volume and depth."],"takeaway":"If liquidity is thin and age is short, move on.","img":"/intel/sections/step1.png"},{"h":"2) Validate Real Use Case + Token Design","p":"Good projects can explain their value in plain English. If the token is not necessary to the product, long-term demand is fragile.","bullets":["Define the exact user problem solved better than incumbents.","Check if users exist now, not just in roadmap narratives.","Inspect supply schedule, unlock cliffs, and inflation pressure."],"takeaway":"Complicated tokenomics usually benefit insiders first.","img":"/intel/sections/step2.png"},{"h":"3) Confirm With On-Chain and Team Execution","p":"On-chain activity is one of the few signals you can verify. Pair that with team quality and governance reality.","bullets":["Track active addresses, transaction value, and fee dynamics over time.","Review wallet concentration and whale dominance risk.","Favor transparent teams, active repos, and clear audit history."],"takeaway":"If usage is falling while price pumps, conviction is weak.","img":"/intel/sections/step3.png"}]',
  true
),
(
  'exchange-execution-playbook',
  'Exchange Execution Playbook: Get Better Fills',
  'Execution is edge. Venue selection, order type, and sizing discipline can save more than fees ever will.',
  'Sponsored Research by Binance',
  '/intel/cards/exchange-execution-playbook.png',
  '[{"k":"Core risk","v":"Slippage and liquidity fragmentation"},{"k":"Hidden cost","v":"Spread + fees + execution quality"},{"k":"Execution rule","v":"Slow is smooth, smooth is fast"}]',
  '[{"h":"1) Match Venue to Trade Size","p":"Not every exchange handles every trade size equally. Routing matters as much as the trade itself.","bullets":["Use aggregators for large orders to minimize market impact.","Check order book depth before sizing any position.","Prefer maker orders where the fee structure rewards patience."],"takeaway":"Slippage on large orders often exceeds the trading fee itself.","img":"/intel/sections/exchange1.png"},{"h":"2) Understand Order Type Tradeoffs","p":"Market orders guarantee execution but not price. Limit orders guarantee price but not execution.","bullets":["Use limit orders during volatile sessions to control fill price.","Avoid market orders on thin books — the spread becomes a hidden tax.","Use maker/post-only behavior when fee structure favors it."],"takeaway":"Order type selection is a silent edge most traders ignore.","img":"/intel/sections/exchange2.png"},{"h":"3) Manage Execution Risk Over Time","p":"Breaking large orders into smaller tranches reduces footprint and market impact.","bullets":["Use TWAP or manual tranching for size above 1% of daily volume.","Monitor your fills — consistent slippage signals you are too large for that venue.","Keep a log of execution quality by exchange to identify your best venue per asset."],"takeaway":"Discipline in execution compounds into real alpha over time.","img":"/intel/sections/exchange3.png"}]',
  true
),
(
  'community-conviction-framework',
  'Community Conviction Framework',
  'Sentiment is a leading indicator. Here is how to read it without getting wrecked by the crowd.',
  'Sponsored Research by Binance',
  '/intel/cards/community-conviction-framework.png',
  '[{"k":"Signal type","v":"Leading — not confirming"},{"k":"Crowd bias","v":"Overconfident at tops, paralyzed at bottoms"},{"k":"Conviction should","v":"Show up in usage, not just posts"}]',
  '[{"h":"1) Separate Signal From Noise in Community Data","p":"Most social data is noise. Volume of posts and price action correlation is weak. Quality and change rate matter more.","bullets":["Track sentiment velocity — the rate of change matters more than the level.","Weight developer and analyst commentary over retail volume.","Watch for divergence: rising posts on falling price often signals a local top."],"takeaway":"Consensus sentiment at extremes is a contrarian signal.","img":"/intel/sections/community1.png"},{"h":"2) Use Conviction Metrics, Not Hype Metrics","p":"Conviction should show up in measurable usage, not just posts. Rising participation often leads durable trend phases.","bullets":["Track wallet growth, active addresses, and transaction value — not follower counts.","Distinguish between new entrants and re-activations in on-chain data.","Sustained volume growth on flat price is a constructive signal."],"takeaway":"Real conviction shows in behavior, not commentary.","img":"/intel/sections/community2.png"},{"h":"3) Build a Framework for Reading Crowd Extremes","p":"The crowd is most dangerous at the extremes. Build rules before you need them.","bullets":["Define your personal fear and greed thresholds before markets move.","Use multi-source sentiment (social + on-chain + funding rates) for confirmation.","Track your own emotional responses as a secondary signal."],"takeaway":"The best trades are made when you disagree with the crowd and are right about why.","img":"/intel/sections/community3.png"}]',
  true
);
