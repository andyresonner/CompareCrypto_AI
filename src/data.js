// src/data.js
// CoinGecko (free, no key) — good enough for MVP.
// If you ever hit CORS/rate limits, we’ll add a tiny proxy backend.

const CG = "https://api.coingecko.com/api/v3";
const COINCAP = "https://api.coincap.io/v2";

const CG_HEADERS = {
  "Accept": "application/json",
  "User-Agent": "CompareCrypto/1.0 (https://comparecrypto.ai; compare tool)",
};

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

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { "Accept": "application/json", ...headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || url}`);
  }
  return res.json();
}

async function fetchJsonCoinGecko(url) {
  return fetchJson(url, CG_HEADERS);
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
  const data = await fetchJsonCoinGecko(`${CG}/search?query=${encodeURIComponent(q)}`);
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
  if (!ids?.length) return { data: [], fromCache: false };
  const key = `cc_mk_${vs}_${ids.join(",")}`;
  const cached = cacheGet(key);
  if (cached) return { data: cached, fromCache: true };

  const url =
    `${CG}/coins/markets?vs_currency=${encodeURIComponent(vs)}` +
    `&ids=${encodeURIComponent(ids.join(","))}` +
    `&price_change_percentage=24h,7d` +
    `&sparkline=false`;

  const data = await fetchJsonCoinGecko(url);
  cacheSet(key, data, 60_000);
  return { data, fromCache: false };
}

// For exchange comparison: pull tickers for a given coin.
// This includes per-exchange last prices (converted_last.usd is super handy)
export async function getCoinTickers(coinId) {
  const key = `cc_tickers_${coinId}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  // per_page=100 to get a decent slice
  const url = `${CG}/coins/${encodeURIComponent(coinId)}/tickers?include_exchange_logo=false&order=volume_desc&per_page=100&page=1`;
  const data = await fetchJsonCoinGecko(url);
  cacheSet(key, data, 60_000);
  return data;
}

// Map symbol to CoinCap asset id (same as CoinGecko id for most)
function symbolToCoinCapId(sym) {
  const u = String(sym).trim().toUpperCase();
  return QUICK_MAP[u]?.id ?? String(sym).trim().toLowerCase();
}

// CoinCap fallback: map symbol list to same row shape as compareAssets (no 7d from CoinCap — use 0)
async function compareAssetsCoinCap(symbols) {
  if (!symbols?.length) return { rows: [], fromCache: false };
  const ids = [...new Set(symbols.map(symbolToCoinCapId))];
  const url = `${COINCAP}/assets?ids=${ids.join(",")}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`CoinCap error ${res.status}`);
  const json = await res.json();
  const list = json?.data ?? [];
  const bySymbol = new Map(list.map((a) => [String(a.symbol).toUpperCase(), a]));
  const rows = [];
  for (const sym of symbols) {
    const u = String(sym).trim().toUpperCase();
    const a = bySymbol.get(u) ?? bySymbol.get(u.toLowerCase());
    if (!a) continue;
    const priceUsd = Number(a.priceUsd ?? 0);
    const ch24 = Number(a.changePercent24Hr ?? 0);
    const sent = sentimentFromPct(ch24);
    const risk = Math.abs(ch24) > 6 ? "High" : Math.abs(ch24) > 3 ? "Medium" : "Low";
    const signal =
      ch24 > 1.5 ? "Bull trend" : ch24 < -1.5 ? "Bear pressure" : ch24 < 0 ? "Pullback" : "Range-bound";
    rows.push({
      sym: String(a.symbol).toUpperCase(),
      tag: a.name ?? a.symbol,
      price: formatMoney(priceUsd, { compact: false, maxFrac: 4 }).replace("$", ""),
      change24h: ch24.toFixed(2),
      change7d: "0.00",
      sentiment: sent.label,
      risk,
      prediction24h: signal,
      mcap: formatMoney(Number(a.marketCapUsd ?? 0), { compact: true }),
    });
  }
  return { rows, fromCache: false };
}

// Compare multiple assets — CoinGecko first, CoinCap fallback; return { rows, fromCache }
export async function compareAssets(symbols) {
  if (!symbols?.length) return { rows: [], fromCache: false };
  const ids = [];
  const resolved = [];
  for (const sym of symbols) {
    try {
      const r = await resolveCoin(sym);
      ids.push(r.id);
      resolved.push({ id: r.id, symbol: r.symbol.toUpperCase(), name: r.name });
    } catch {
      // skip unknown
    }
  }

  let marketsData = [];
  let fromCache = false;

  if (ids.length > 0) {
    try {
      const out = await getMarketsByIds(ids);
      marketsData = Array.isArray(out?.data) ? out.data : out?.data ?? [];
      fromCache = !!out?.fromCache;
    } catch {
      // fallback to CoinCap
      const cap = await compareAssetsCoinCap(symbols);
      return cap;
    }
  }

  if (!marketsData.length && symbols.length > 0) {
    try {
      return await compareAssetsCoinCap(symbols);
    } catch (e) {
      throw new Error("Could not load asset data. Try again in a moment.");
    }
  }

  const byId = new Map(marketsData.map((m) => [m.id, m]));
  const rows = resolved
    .filter((r) => byId.has(r.id))
    .map((r) => {
      const m = byId.get(r.id);
      const ch = Number(m?.price_change_percentage_24h) ?? 0;
      const sent = sentimentFromPct(ch);
      const ch7 = Number(m?.price_change_percentage_7d_in_currency) ?? 0;
      const risk = Math.abs(ch) > 6 ? "High" : Math.abs(ch) > 3 ? "Medium" : "Low";
      const signal =
        ch > 1.5 && ch7 > 0
          ? "Bull trend"
          : ch < -1.5 && ch7 < 0
            ? "Bear pressure"
            : ch < 0 && ch7 > 0
              ? "Pullback"
              : "Range-bound";
      return {
        sym: r.symbol,
        tag: r.name,
        price: formatMoney(m?.current_price ?? 0, { compact: false, maxFrac: 4 }).replace("$", ""),
        change24h: ch.toFixed(2),
        change7d: ch7.toFixed(2),
        sentiment: sent.label,
        risk,
        prediction24h: signal,
        mcap: formatMoney(m?.market_cap ?? 0, { compact: true }),
      };
    });

  return { rows, fromCache };
}

// Scan exchanges for an asset — real prices from CoinGecko tickers
export async function scanExchanges(assetSymbol, selectedExchanges = []) {
  const coin = await resolveCoin(assetSymbol);
  const tickersData = await getCoinTickers(coin.id);
  const rows = extractExchangeQuotes(tickersData, selectedExchanges);

  // If no selection, show top 6 by volume
  const display = rows.length > 0 ? rows : extractExchangeQuotes(tickersData, []);

  const sliced = display.slice(0, 8);
  const best = Math.min(...sliced.map((r) => r.usd));

  return sliced.map((r) => {
    const vsBestPct = best > 0 ? ((r.usd - best) / best) * 100 : 0;
    return {
      exchange: r.exchange,
      pair: r.pair || `${coin.symbol.toUpperCase()}/USDT`,
      price: formatMoney(r.usd, { compact: false, maxFrac: 2 }).replace("$", ""),
      spread: `${vsBestPct.toFixed(2)}%`,
      liquidity: r.volumeUsd > 1e9 ? "High" : r.volumeUsd > 1e8 ? "Medium" : "Low",
      volumeUsd: r.volumeUsd,
      trust: r.trust,
      signal: vsBestPct <= 0.05 ? "Best buy" : "Monitor",
    };
  });
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
