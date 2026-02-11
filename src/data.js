// src/data.js
// CoinGecko (free, no key) — good enough for MVP.
// If you ever hit CORS/rate limits, we’ll add a tiny proxy backend.

const CG = "https://api.coingecko.com/api/v3";

// Small “fast map” so common tickers work instantly
const QUICK_MAP = {
  BTC: { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
  ETH: { id: "ethereum", symbol: "eth", name: "Ethereum" },
  SOL: { id: "solana", symbol: "sol", name: "Solana" },
  ADA: { id: "cardano", symbol: "ada", name: "Cardano" },
  DOGE: { id: "dogecoin", symbol: "doge", name: "Dogecoin" },
  DOT: { id: "polkadot", symbol: "dot", name: "Polkadot" },
  XRP: { id: "ripple", symbol: "xrp", name: "XRP" },
  AVAX: { id: "avalanche-2", symbol: "avax", name: "Avalanche" },
  LINK: { id: "chainlink", symbol: "link", name: "Chainlink" },
  MATIC: { id: "matic-network", symbol: "matic", name: "Polygon" },
  USDT: { id: "tether", symbol: "usdt", name: "Tether" },
  USDC: { id: "usd-coin", symbol: "usdc", name: "USD Coin" },
};

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() > obj.exp) return null;
    return obj.val;
  } catch {
    return null;
  }
}

function cacheSet(key, val, ttlMs = 60_000) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ exp: Date.now() + ttlMs, val }));
  } catch {}
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "accept": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || url}`);
  }
  return res.json();
}

export function normalizeSymbol(input) {
  return String(input || "").trim().toUpperCase();
}

export function formatMoney(n, opts = {}) {
  const num = Number(n);
  if (!isFinite(num)) return "—";
  const compact = opts.compact ?? true;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: opts.maxFrac ?? 2,
  }).format(num);
}

export function formatPct(n) {
  const num = Number(n);
  if (!isFinite(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function sentimentFromPct(p) {
  const n = Number(p);
  if (!isFinite(n)) return { label: "Neutral", tone: "neutral" };
  if (n >= 2) return { label: "Bullish", tone: "up" };
  if (n <= -2) return { label: "Bearish", tone: "down" };
  return { label: "Neutral", tone: "neutral" };
}

// Resolve a user input like "BTC" or "bitcoin" into a CoinGecko coin id
export async function resolveCoin(query) {
  const q = String(query || "").trim();
  if (!q) return QUICK_MAP.BTC;

  const sym = normalizeSymbol(q);
  if (QUICK_MAP[sym]) return QUICK_MAP[sym];

  const cacheKey = `cc_resolve_${sym}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // CoinGecko search
  const data = await fetchJson(`${CG}/search?query=${encodeURIComponent(q)}`);
  const best = data?.coins?.[0];
  if (!best?.id) {
    throw new Error(`Couldn't find coin for "${q}". Try BTC, ETH, SOL, etc.`);
  }

  const resolved = {
    id: best.id,
    symbol: best.symbol,
    name: best.name,
  };

  cacheSet(cacheKey, resolved, 10 * 60_000);
  return resolved;
}

export async function getMarketsByIds(ids, vs = "usd") {
  if (!ids?.length) return [];
  const key = `cc_mk_${vs}_${ids.join(",")}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url =
    `${CG}/coins/markets?vs_currency=${encodeURIComponent(vs)}` +
    `&ids=${encodeURIComponent(ids.join(","))}` +
    `&price_change_percentage=24h` +
    `&sparkline=false`;

  const data = await fetchJson(url);
  cacheSet(key, data, 30_000);
  return data;
}

// For exchange comparison: pull tickers for a given coin.
// This includes per-exchange last prices (converted_last.usd is super handy)
export async function getCoinTickers(coinId) {
  const key = `cc_tickers_${coinId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  // per_page=100 to get a decent slice
  const url = `${CG}/coins/${encodeURIComponent(coinId)}/tickers?include_exchange_logo=false&order=volume_desc&per_page=100&page=1`;
  const data = await fetchJson(url);
  cacheSet(key, data, 30_000);
  return data;
}

// Build an exchange view for selected exchanges
export function extractExchangeQuotes(tickersData, selectedExchangeNames) {
  const want = new Set(
    selectedExchangeNames.map((x) => String(x || "").trim().toLowerCase())
  );

  const rows = [];
  const tickers = tickersData?.tickers || [];

  for (const t of tickers) {
    const ex = t?.market?.name;
    if (!ex) continue;

    if (want.size > 0 && !want.has(ex.toLowerCase())) continue;

    const usd =
      t?.converted_last?.usd ??
      t?.converted_last?.USD ??
      t?.last ??
      null;

    if (!isFinite(Number(usd))) continue;

    rows.push({
      exchange: ex,
      pair: `${t.base}/${t.target}`,
      usd: Number(usd),
      volumeUsd: Number(t?.converted_volume?.usd ?? 0),
      trust: t?.trust_score ?? "—",
    });
  }

  // keep best row per exchange (highest volume)
  const bestByExchange = new Map();
  for (const r of rows) {
    const prev = bestByExchange.get(r.exchange);
    if (!prev || r.volumeUsd > prev.volumeUsd) bestByExchange.set(r.exchange, r);
  }

  return Array.from(bestByExchange.values()).sort((a, b) => b.volumeUsd - a.volumeUsd);
}
