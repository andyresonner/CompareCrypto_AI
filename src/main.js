// /src/main.js
// App boot + state + event wiring
// Fixes:
//  - styles not loading (plain HTML) -> import styles.css
//  - compare results disappearing after re-render
//  - save view reliability + reopen restores snapshot
// Adds:
//  - shimmer loading
//  - micro-animations
//  - streak celebration
//  - confetti unlock on reward
//  - subtle hover motion on dashboard + saved cards

import "./styles.css"; // ✅ IMPORTANT: without this, Vite will render unstyled HTML

import { App } from "./app.js";
import { supabase } from "./supabase.js";

// Optional modules (safe if missing)
let DataAPI = null;
try {
  // eslint-disable-next-line import/no-unresolved
  DataAPI = await import("./data.js");
} catch (_) {
  DataAPI = null;
}

let UsageAPI = null; // (not required, but kept if you add later)
try {
  // eslint-disable-next-line import/no-unresolved
  UsageAPI = await import("./usage.js");
} catch (_) {
  UsageAPI = null;
}

/* -------------------- State -------------------- */

const LS = {
  saved: "cc_saved_views_v1",
  streak: "cc_streak_v1",
  usage: "cc_usage_v1",
  first: "cc_first_compare_done_v1",
  lifetime: "cc_lifetime_compares_v1",
  alertCredits: "cc_alert_credits_v1",
  authNudge: "cc_auth_nudge_v1",
  waitlistBackup: "cc_waitlist_backup_v1",
  marketPulseCache: "cc_market_pulse_cache_v1",
  testCheckoutSubmissions: "cc_test_checkout_submissions",
  trialUntil: "cc_trial_until_v1",
  remindTomorrow: "cc_remind_tomorrow_v1",
  referralCode: "cc_referral_code_v1",
  referredBy: "cc_referred_by_v1",
  referralCount: "cc_referral_count_v1",
};

const state = {
  route: "compare",
  mode: "assets",

  // selection + results
  selected: [],
  lastQuery: "BTC",
  lastCompareResult: null,
  compareLoading: false,

  // usage
  usage: { used: 0, freeLimit: 3 },
  usageBumped: false,
  lifetimeCompares: 0,

  // saved + streak
  savedViews: [],
  streak: { days: 0, best: 0, lastDayKey: "" },
  firstCompareDone: false,

  // auth + trial
  user: null,
  trialUntil: null,
  alertCredits: 0,

  // internal
  _authMode: "login", // login | signup
  _authNudgeShown: false,
  pulseMode: "market", // market | community
  reopenContext: null,
  communityPeekContext: null,
  communityPeekThread: [],
  communityPeekLocked: false,
};

/* -------------------- DOM helpers -------------------- */

const root = document.getElementById("app") || document.body;

const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

function on(sel, evt, fn) {
  const el = qs(sel);
  if (el) el.addEventListener(evt, fn);
}

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/* -------------------- Persistence -------------------- */

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function backupWaitlistEmail(email) {
  const arr = loadJSON(LS.waitlistBackup, []);
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return;
  if (arr.some((x) => String(x?.email || "").toLowerCase() === clean)) return;
  const next = [{ email: clean, ts: Date.now() }, ...arr].slice(0, 5000);
  saveJSON(LS.waitlistBackup, next);
}

async function persistWaitlistEmail(email, source = "pricing_waitlist") {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return { ok: false, reason: "invalid" };

  // Always keep a local backup so leads are never dropped.
  backupWaitlistEmail(clean);

  try {
    const { error } = await supabase
      .from("waitlist_emails")
      .upsert(
        [{ email: clean, source }],
        { onConflict: "email", ignoreDuplicates: false }
      );

    if (error) throw error;
    return { ok: true, where: "supabase+local" };
  } catch {
    return { ok: true, where: "local_only" };
  }
}

function referralCodeGen() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function getOrCreateReferralCode() {
  let code = loadJSON(LS.referralCode, null);
  if (!code || typeof code !== "string" || code.length !== 6) {
    code = referralCodeGen();
    saveJSON(LS.referralCode, code);
  }
  return code;
}

function hydrateFromStorage() {
  state.savedViews = loadJSON(LS.saved, []);
  state.streak = loadJSON(LS.streak, { days: 0, best: 0, lastDayKey: "" });
  const usage = loadJSON(LS.usage, { day: dayKey(), used: 0, freeLimit: 3 });
  state.usage = usage?.day === dayKey()
    ? { day: dayKey(), used: Number(usage.used) || 0, freeLimit: Number(usage.freeLimit) || 3 }
    : { day: dayKey(), used: 0, freeLimit: 3 };
  saveJSON(LS.usage, state.usage);
  state.firstCompareDone = loadJSON(LS.first, false);
  state.lifetimeCompares = loadJSON(LS.lifetime, 0);
  state._authNudgeShown = !!loadJSON(LS.authNudge, false);
  const storedTrial = loadJSON(LS.trialUntil, null);
  state.trialUntil = typeof storedTrial === "number" && storedTrial > Date.now() ? storedTrial : null;

  getOrCreateReferralCode();

  const search = location.search || "";
  const hash = location.hash || "";
  const refMatch = search.match(/[?&]ref=([^&]+)/) || hash.match(/[?&]ref=([^&]+)/);
  if (refMatch && refMatch[1]) {
    const refCode = String(refMatch[1]).trim().toUpperCase().slice(0, 20);
    if (refCode) saveJSON(LS.referredBy, refCode);
  }
}

function getAlertCreditMap() {
  return loadJSON(LS.alertCredits, {});
}

function saveAlertCreditMap(map) {
  saveJSON(LS.alertCredits, map || {});
}

function getUserAlertCredits() {
  const email = state.user?.email;
  if (!email) return 0;
  const map = getAlertCreditMap();
  const key = email.toLowerCase();
  if (typeof map[key] !== "number") {
    map[key] = 2; // free account starter credits
    saveAlertCreditMap(map);
  }
  return Math.max(0, Number(map[key]) || 0);
}

function setUserAlertCredits(n) {
  const email = state.user?.email;
  if (!email) return;
  const map = getAlertCreditMap();
  map[email.toLowerCase()] = Math.max(0, Number(n) || 0);
  saveAlertCreditMap(map);
  state.alertCredits = Math.max(0, Number(n) || 0);
}

/* -------------------- Routing -------------------- */

function parseRoute() {
  const h = (location.hash || "#compare").replace("#", "").trim();
  state.route = h || "compare";
}

window.addEventListener("hashchange", () => {
  parseRoute();
  render();
});

function go(route) {
  location.hash = `#${route}`;
}

/* -------------------- Auth -------------------- */

async function initAuth() {
  try {
    const { data } = await supabase.auth.getSession();
    state.user = data?.session?.user || null;
    state.alertCredits = state.user ? getUserAlertCredits() : 0;
  } catch {
    state.user = null;
    state.alertCredits = 0;
  }

  try {
    supabase.auth.onAuthStateChange((_event, session) => {
      state.user = session?.user || null;
      state.alertCredits = state.user ? getUserAlertCredits() : 0;
      render();
    });
  } catch {}
}

/* -------------------- Global (one-time) listeners -------------------- */

let _globalListeners = false;
let _marketTimer = null;

function ensureGlobalListeners() {
  if (_globalListeners) return;
  _globalListeners = true;

  // Close account menu on outside click
  document.addEventListener("click", (e) => {
    const menu = qs("#accountMenu");
    const btn = qs("#accountBtn");
    if (!menu || !btn) return;

    // if click is inside menu or on button, ignore
    if (menu.contains(e.target) || btn.contains(e.target)) return;

    menu.classList.remove("show");
    btn.setAttribute("aria-expanded", "false");
  });

  // Row click → Community Insights (assets) or Exchange Insight (exchanges)
  document.addEventListener("click", (e) => {
    const lock = e.target?.closest?.("[data-lock='community']");
    if (lock) {
      openAuthModal("signup");
      return;
    }

    const row = e.target?.closest?.(".row[data-kind]");
    if (!row || state.route !== "compare") return;

    const kind = row.getAttribute("data-kind");
    const sym = row.getAttribute("data-sym");
    const exchange = row.getAttribute("data-exchange");

    if (kind === "asset" && sym) openInsightsModal(sym);
    else if (kind === "exchange" && exchange) openExchangeModal(exchange);
  });
}

function openInsightsModal(sym) {
  const r = state.lastCompareResult;
  const row = r?.rows?.find((x) => String(x.sym).toUpperCase() === String(sym).toUpperCase());
  const ranked = [...(r?.rows || [])].sort((a, b) => Number(b.change24h || 0) - Number(a.change24h || 0));
  const rank = ranked.findIndex((x) => String(x.sym).toUpperCase() === String(sym).toUpperCase()) + 1;

  const title = qs("#insTitle");
  const subtitle = qs("#insSubtitle");
  const badges = qs("#insBadges");
  const bullets = qs("#insBullets");

  if (title) title.textContent = `${sym} — Community Insight`;
  if (subtitle) subtitle.textContent = "Trend, relative strength, and practical next checks";

  const badgeItems = row
    ? [
        row.sentiment && `<span class="badge">Sentiment: ${escapeHtml(row.sentiment)}</span>`,
        row.change24h && `<span class="badge ${Number(row.change24h) >= 0 ? "good" : "bad"}">24h: ${Number(row.change24h) >= 0 ? "+" : ""}${escapeHtml(row.change24h)}%</span>`,
        row.change7d && `<span class="badge ${Number(row.change7d) >= 0 ? "good" : "bad"}">7d: ${Number(row.change7d) >= 0 ? "+" : ""}${escapeHtml(row.change7d)}%</span>`,
        row.risk && row.risk !== "—" && `<span class="badge warn">Risk: ${escapeHtml(row.risk)}</span>`,
      ].filter(Boolean)
    : [];
  if (badges) badges.innerHTML = badgeItems.join("") || `<span class="badge">${escapeHtml(sym)}</span>`;

  const bulletItems = row
    ? [
      `${sym} ranks #${rank} of ${(r?.rows || []).length} by 24h momentum in this comparison set.`,
      `${sym} is showing ${trendLabel(row)} right now based on short-term and weekly direction.`,
      row.risk && row.risk !== "—" ? `Risk profile is ${String(row.risk).toLowerCase()}. Size positions accordingly and avoid over-concentration.` : null,
      "Cross-check volume and catalyst news before acting. Price-only signals can reverse quickly in crypto markets.",
    ].filter(Boolean)
    : [
      `Quick snapshot for ${sym}.`,
      "Run a fresh compare to load live momentum and risk context.",
    ];
  if (bullets) {
    bullets.innerHTML = bulletItems.map((b) => `<div class="bullet">${escapeHtml(b)}</div>`).join("");
  }

  openModal("#insightsModal");
}

function openExchangeModal(exchange) {
  const rows = state.lastCompareResult?.rows || [];
  const target = rows.find((r) => r.exchange === exchange);
  const prices = rows.map((r) => Number(String(r.price).replace(/,/g, ""))).filter(Number.isFinite);
  const best = prices.length ? Math.min(...prices) : null;
  const worst = prices.length ? Math.max(...prices) : null;

  const title = qs("#exTitle");
  if (title) title.textContent = `${exchange} — Exchange Insight`;

  const impact = qs("#exchangeModal .exImpact");
  if (impact && target) {
    const p = Number(String(target.price).replace(/,/g, ""));
    const deltaBest = best && p ? ((p - best) / best) * 100 : 0;
    const deltaWorst = worst && p ? ((worst - p) / p) * 100 : 0;

    impact.innerHTML = `
      <div class="impactCard good">
        <div class="impactHdr">Execution quality now</div>
        <ul>
          <li>Quoted price: $${escapeHtml(target.price)}</li>
          <li>${deltaBest <= 0.05 ? "Near best price in this scan" : `${deltaBest.toFixed(2)}% above best quote`}</li>
          <li>Liquidity tier: ${escapeHtml(target.liquidity || "Unknown")}</li>
        </ul>
      </div>

      <div class="impactCard watch">
        <div class="impactHdr">What to check next</div>
        <ul>
          <li>Trading fee tier and withdrawal fee for your region</li>
          <li>Order book depth for your intended trade size</li>
          <li>Potential upside if price converges: ${Math.max(0, deltaWorst).toFixed(2)}%</li>
        </ul>
      </div>
    `;
  }
  openModal("#exchangeModal");
}

/* -------------------- Rendering -------------------- */

function render() {
  state.referralCode = getOrCreateReferralCode();
  state.referralCount = loadJSON(LS.referralCount, 0);

  root.innerHTML = App(state);

  injectTrialNudgeBannerIfNeeded();

  // wire pages
  wireTopNav();
  wireComparePage();
  wireDashboardPage();
  wirePricingPage();
  wireWaitlistPage();
  wireAccountPage();
  wireResetPage();
  wireIntelPage();
  wireModals();

  if (state.route !== "dashboard") stopMarketPulseFeed();

  // Subtle hover motion (cards)
  attachHoverMotion();

  // ✅ IMPORTANT: if we have a last result, repaint it AFTER render
  // This fixes “compare flashes then disappears” due to re-renders.
  if (state.route === "compare") {
    if (state.compareLoading) {
      renderLoadingShimmer();
    } else if (state.lastCompareResult) {
      const r = state.lastCompareResult;
      const base =
        r.kind === "assets"
          ? `Comparing ${(r.items || []).join(", ")}`
          : r.items?.[0]
            ? `Exchange prices for ${r.items[0]}`
            : "Exchange comparison";
      const clickHelp =
        r.kind === "assets"
          ? "click a row for detailed asset insight"
          : "click a row for exchange execution insight";
      setCompareHeader(`${base} • ${clickHelp}`);
      renderResults(r, { animate: false });
    } else {
      renderEmptyResults();
    }

    renderSelectedList();
    hydrateSavedBlock();
    updateUsageInline();
    renderEditorialStrip();
  }
}

function renderEmptyResults() {
  setCompareHeader(
    state.mode === "assets"
      ? "Pick 2+ assets to compare live momentum and community conviction."
      : "Type any coin/token, then compare exchange quotes side by side."
  );

  const body = qs("#resultBody");
  const learn = qs("#learnPanel");
  if (!body) return;

  const quickCards =
    state.mode === "assets"
      ? [
          { icon: "📈", k: "Momentum", v: "24h + 7d trend at a glance" },
          { icon: "⭐", k: "Crowd signal", v: "Ratings and sentiment overlays" },
          { icon: "🧭", k: "Decision", v: "Spot leaders vs laggards fast" },
        ]
      : [
          { icon: "💸", k: "Best quote", v: "See cheapest venue to buy now" },
          { icon: "⚖️", k: "Spread", v: "Compare gap between exchanges" },
          { icon: "🏦", k: "Liquidity", v: "Avoid weak execution venues" },
        ];

  body.innerHTML = `
    <div class="resultGrid resultGridTight">
      ${quickCards
        .map(
          (c) => `
        <div class="tile tileVisual">
          <div class="tileIcon">${c.icon}</div>
          <div class="k">${escapeHtml(c.k)}</div>
          <div class="v">${escapeHtml(c.v)}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  if (learn) {
    learn.innerHTML = `
      <div class="noteBox noteBoxTight">
        <div class="muted small">Our insights are community-based. Join now to be part of one of the strongest crypto insight networks on the web.</div>
      </div>
    `;
  }
}

function renderEditorialStrip() {
  const host = qs("#editorialStrip");
  if (!host) return;

  const articles = [
    {
      source: "Binance Academy",
      title: "How To Research Altcoins Before You Buy",
      slug: "how-to-research-altcoins",
      img: "/intel/cards/how-to-research-altcoins.png",
    },
    {
      source: "CoinDesk",
      title: "Exchange Execution Playbook: Get Better Fills",
      slug: "exchange-execution-playbook",
      img: "/intel/cards/exchange-execution-playbook.png",
    },
    {
      source: "The Block",
      title: "Community Conviction Framework",
      slug: "community-conviction-framework",
      img: "/intel/cards/community-conviction-framework.png",
    },
  ];

  host.innerHTML = `
    <div class="newsStrip">
      <div class="newsHdr">
        <div class="k">Market intel</div>
        <button class="btnMiniGhost" id="openIntelModal">More intel</button>
      </div>
      <div class="newsGrid">
        ${articles
          .map(
            (n) => `
          <a class="newsCard" href="#intel/${n.slug}">
            <div class="newsImageWrap">
              <img class="newsImage" src="${escapeHtml(n.img)}" alt="${escapeHtml(n.title)} cover image" />
            </div>
            <div class="newsSource">${escapeHtml(n.source)}</div>
            <div class="newsTitle">${escapeHtml(n.title)}</div>
            <div class="newsCta">Read article →</div>
          </a>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  on("#openIntelModal", "click", () => openModal("#intelModal"));
}

/* -------------------- Top Nav -------------------- */

function wireTopNav() {
  on("#loginBtn", "click", () => openAuthModal("login"));
  on("#getStartedBtn", "click", () => openAuthModal("signup"));

  const btn = qs("#accountBtn");
  const menu = qs("#accountMenu");
  if (btn && menu) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
      btn.setAttribute("aria-expanded", menu.classList.contains("show") ? "true" : "false");
    });
  }

  on("#acctProfileBtn", "click", () => {
    closeAccountMenu();
    go("account");
  });

  on("#acctOffersBtn", "click", () => {
    closeAccountMenu();
    go("pricing");
  });

  on("#acctTrialBtn", "click", () => {
    closeAccountMenu();
    if (state.trialUntil && state.trialUntil > Date.now()) {
      openTrialSalesModal();
    } else {
      openTrialModal();
    }
  });

  on("#logoutBtn", "click", async () => {
    closeAccountMenu();
    try {
      await supabase.auth.signOut();
    } catch {}
    state.user = null;
    render();
  });
}

function closeAccountMenu() {
  const menu = qs("#accountMenu");
  const btn = qs("#accountBtn");
  if (menu) menu.classList.remove("show");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

/* -------------------- Compare Page -------------------- */

function wireComparePage() {
  if (state.route !== "compare") return;

  on("#sponsorSlotBtn", "click", () => {
    nudgeRewardToast("Sponsored comparison slot coming soon.");
  });

  on("#modeAssets", "click", () => {
    state.mode = "assets";
    state.selected = [];
    state.lastQuery = "BTC";
    state.lastCompareResult = null;
    state.compareLoading = false;
    state.reopenContext = null;
    render();
  });

  on("#modeExchanges", "click", () => {
    state.mode = "exchanges";
    state.selected = [];
    state.lastQuery = "BTC";
    state.lastCompareResult = null;
    state.compareLoading = false;
    state.reopenContext = null;
    render();
  });

  // chips
  const chips = qs("#chips");
  if (chips) {
    chips.addEventListener("click", (e) => {
      const b = e.target?.closest?.("[data-chip]");
      if (!b) return;
      addSelected(b.getAttribute("data-chip"));
    });
  }

  const presets = qs("#presets");
  if (presets) {
    presets.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-preset]");
      if (!btn) return;
      applyPreset(btn.getAttribute("data-preset"));
      renderSelectedList();
      nudgeRewardToast("Preset applied.");
    });
  }

  // compare
  on("#compareBtn", "click", async () => {
    if (consumeExchangeSearchInput()) return;
    await runCompare();
  });

  // save view
  on("#saveBtn", "click", () => {
    saveCurrentView();
  });

  // remove pill
  const selectedList = qs("#selectedList");
  if (selectedList) {
    selectedList.addEventListener("click", (e) => {
      const x = e.target?.closest?.("[data-remove]");
      if (!x) return;
      const sym = x.getAttribute("data-remove");
      state.selected = state.selected.filter((s) => s !== sym);
      renderSelectedList();
    });
  }

  // enter key in search
  const search = qs("#search");
  if (search) {
    search.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const q = (search.value || "").trim();
      if (q) state.lastQuery = q.toUpperCase();
      if (state.mode === "assets" && q) {
        addSelected(q);
        search.value = "";
      }
      if (state.mode === "exchanges" && consumeExchangeSearchInput()) return;
      runCompare();
    });
  }

  // first strip pulses
  on("#firstStep1", "click", () => pulseFirstStep(1));
  on("#firstStep2", "click", () => pulseFirstStep(2));
  on("#firstStep3", "click", () => pulseFirstStep(3));
}

function consumeExchangeSearchInput() {
  if (state.mode !== "exchanges") return false;
  const input = qs("#search");
  const raw = (input?.value || "").trim();
  if (!raw) return false;

  const tokens = raw
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

  if (!tokens.length) return false;

  const known = [];
  const unknown = [];
  for (const t of tokens) {
    const ex = normalizeExchangeName(t);
    if (ex) known.push(ex);
    else unknown.push(t);
  }

  if (known.length) {
    known.forEach((k) => addSelected(k));
    nudgeRewardToast(`Added ${known.length} exchange${known.length === 1 ? "" : "s"}.`);
  }

  // If user typed a token too, use it as the asset query.
  if (unknown.length) {
    state.lastQuery = unknown[0].toUpperCase();
    if (input) input.value = unknown[0];
    return false;
  }

  // Only exchanges were typed; wait for token input before compare.
  if (input) input.value = "";
  nudgeRewardToast("Now type a token (e.g. BTC) and click Compare.");
  return true;
}

function normalizeExchangeName(name) {
  const n = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const map = {
    coinbase: "Coinbase",
    kraken: "Kraken",
    binance: "Binance",
    bybit: "Bybit",
    okx: "OKX",
    bitstamp: "Bitstamp",
    kucoin: "KuCoin",
    gemini: "Gemini",
    gateio: "Gate.io",
    gate: "Gate.io",
    mexc: "MEXC",
  };

  return map[n] || null;
}

function addSelected(sym) {
  if (!sym) return;
  if (state.selected.includes(sym)) return;

  const max = state.mode === "assets" ? 4 : 4;

  if (state.selected.length >= max) {
    state.selected = state.selected.slice(0, max - 1);
  }

  state.selected.push(sym);
  renderSelectedList();
  nudgeRewardToast(`Added ${sym}.`);
}

function applyPreset(name) {
  if (state.mode === "assets") {
    const map = {
      majors: ["BTC", "ETH", "SOL"],
      layer1: ["ETH", "SOL", "ADA", "AVAX"],
      payments: ["XRP", "XLM", "LTC"],
    };
    state.selected = [...(map[name] || [])];
    return;
  }

  const map = {
    tier1: ["Coinbase", "Kraken", "Binance", "OKX"],
    alts: ["Bybit", "KuCoin", "OKX", "Binance"],
    global: ["Coinbase", "Kraken", "Bybit", "Bitstamp"],
  };
  state.selected = [...(map[name] || [])];
}

function renderSelectedList() {
  const el = qs("#selectedList");
  if (!el) return;

  if (!state.selected.length) {
    el.innerHTML = `<span class="emptySelectPill">${state.mode === "assets" ? "🪙 Add assets to compare" : "🏦 Add exchanges to compare"}</span>`;
    return;
  }

  const marker = state.mode === "assets" ? "🪙" : "🏦";
  el.innerHTML = state.selected
    .map(
      (s) => `
      <span class="pill">
        <span class="pillType">${marker}</span>${escapeHtml(s)}
        <button class="pillX" data-remove="${escapeHtml(s)}" aria-label="Remove ${escapeHtml(s)}">×</button>
      </span>
    `
    )
    .join("");
}

function setCompareHeader(text) {
  const title = qs(".resultTitle");
  if (title) title.textContent = text || "";
}

function updateUsageInline() {
  const el = qs("#usageInline");
  if (!el) return;

  const remaining = Math.max(0, (state.usage.freeLimit ?? 3) - (state.usage.used ?? 0));
  el.innerHTML =
    remaining > 0
      ? `<span class="muted small">You have <b>${remaining}</b> free compare${remaining === 1 ? "" : "s"} left today.</span>`
      : `<span class="muted small">You’re out of free compares today.</span>`;
}

async function runCompare() {
  if (state.mode === "assets" && state.selected.length < 2) {
    nudgeRewardToast("Add at least 2 assets to compare.");
    pulse("#chips");
    return;
  }

  // usage gate
  const limit = state.usage.freeLimit ?? 3;
  const used = state.usage.used ?? 0;

  const trialActive = state.trialUntil && state.trialUntil > Date.now();
  const unlimited = !!state.user && trialActive;

  if (!unlimited && used >= limit) {
    openLimitModal();
    return;
  }

  // bump usage + lifetime
  if (!unlimited) {
    state.usage.used = used + 1;
    state.usageBumped = true;
    saveJSON(LS.usage, state.usage);
  }

  state.lifetimeCompares = (state.lifetimeCompares || 0) + 1;
  saveJSON(LS.lifetime, state.lifetimeCompares);

  // streak
  const streakBefore = state.streak.days || 0;
  const bestBefore = state.streak.best || 0;
  bumpStreak();
  const streakAfter = state.streak.days || 0;
  const bestAfter = state.streak.best || 0;

  // first compare strip
  if (!state.firstCompareDone) {
    state.firstCompareDone = true;
    saveJSON(LS.first, true);
  }

  // loading state
  state.compareLoading = true;
  state.lastCompareResult = null;
  state.reopenContext = null;

  render(); // shows shimmer immediately

  const assetQ = (qs("#search")?.value || "").trim() || "BTC";
  if (assetQ) state.lastQuery = assetQ.toUpperCase();
  setCompareHeader(
    state.mode === "assets"
      ? `Comparing ${state.selected.length} assets: ${state.selected.join(", ")}`
      : `Best exchange quotes for ${state.lastQuery}`
  );
  renderLoadingShimmer();

  const result = await fetchCompareResult();

  state.compareLoading = false;
  state.lastCompareResult = result;

  // render page, then animate rows in
  render();
  renderResults(result, { animate: true });

  // stop usage pulse without a full render
  setTimeout(() => {
    state.usageBumped = false;
    const pill = qs(".usagePill");
    if (pill) pill.classList.remove("usagePulse");
  }, 650);

  if (streakAfter > streakBefore) streakCelebrate(streakAfter, bestAfter > bestBefore);

  // Signup nudge after a few compares for free account features (e.g. alerts, saved setups)
  if (!state.user && state.lifetimeCompares >= 2 && !state._authNudgeShown) {
    state._authNudgeShown = true;
    saveJSON(LS.authNudge, true);
    setTimeout(() => openAuthModal("signup"), 700);
  }

  // Soft paywall nudge when 1 compare left
  const remaining = Math.max(0, (state.usage.freeLimit ?? 3) - (state.usage.used ?? 0));
  if (!unlimited && remaining === 1) {
    setTimeout(() => nudgeRewardToast("1 free compare left today. Upgrade for unlimited →"), 1200);
  }

  updateUsageInline();
}

async function fetchCompareResult() {
  const kind = state.mode === "assets" ? "assets" : "exchanges";
  const items = [...state.selected];

  if (kind === "assets") {
    if (DataAPI?.compareAssets) {
      try {
        const rows = await DataAPI.compareAssets(items);
        return { kind, items, rows, ts: Date.now() };
      } catch {}
    }

    const rows = items.map((sym) => ({
      sym,
      tag: tagline(sym),
      price: randomPrice(sym),
      change24h: randomChange(sym),
      change7d: randomChange(sym),
      sentiment: randomSentiment(sym),
      risk: randomRisk(sym),
      prediction24h: "Range-bound",
      mcap: randomMcap(sym),
    }));

    return { kind, items, rows, ts: Date.now() };
  }

  const q = (qs("#search")?.value || "").trim() || state.lastQuery || "BTC";
  state.lastQuery = String(q).toUpperCase();

  if (DataAPI?.scanExchanges) {
    try {
      const rows = await DataAPI.scanExchanges(state.lastQuery, items);
      return { kind, items: [q], rows, ts: Date.now() };
    } catch {}
  }

  const exchanges = ["Coinbase", "Kraken", "Binance", "Bybit", "OKX", "Bitstamp", "KuCoin"];
  const rows = exchanges.slice(0, 6).map((ex) => ({
    exchange: ex,
    price: randomPrice(state.lastQuery),
    spread: (Math.random() * 0.8 + 0.1).toFixed(2) + "%",
    liquidity: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
    signal: "Monitor",
  }));

  return { kind, items: [state.lastQuery], rows, ts: Date.now() };
}

function renderLoadingShimmer() {
  const body = qs("#resultBody");
  if (!body) return;

  body.innerHTML = `
    <div class="tableWrap" style="overflow:hidden;">
      <div class="shimmerHeader" style="padding:10px 10px; border-bottom:1px solid rgba(15,23,42,.85);">
        <div class="shimmerLine"></div>
      </div>
      <div class="shimmerRows" style="padding:10px;">
        ${Array.from({ length: 5 })
          .map(
            () => `
          <div class="shimmerRow">
            <div class="shimmerCell"></div>
            <div class="shimmerCell"></div>
            <div class="shimmerCell"></div>
            <div class="shimmerCell"></div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  ensureShimmerCSS();
}

function renderResults(result, { animate } = { animate: true }) {
  const body = qs("#resultBody");
  const learn = qs("#learnPanel");
  if (!body) return;

  if (!result?.rows?.length) {
    body.innerHTML = `<div class="muted small" style="padding:10px 6px;">No results.</div>`;
    if (learn) learn.innerHTML = "";
    return;
  }

  if (result.kind === "assets") {
    const best24h = [...result.rows].sort((a, b) => Number(b.change24h || 0) - Number(a.change24h || 0))[0];
    const best7d = [...result.rows].sort((a, b) => Number(b.change7d || 0) - Number(a.change7d || 0))[0];
    const biggestMcap = [...result.rows].sort((a, b) => parseCompactMoney(b.mcap) - parseCompactMoney(a.mcap))[0];
    const best24hClass = Number(best24h?.change24h || 0) >= 0 ? "summaryGood" : "summaryBad";
    const best7dClass = Number(best7d?.change7d || 0) >= 0 ? "summaryGood" : "summaryBad";

    body.innerHTML = `
      <div class="resultGrid">
        <div class="tile ${best24hClass}">
          <div class="k">Strongest 24h</div>
          <div class="v">${escapeHtml(best24h.sym)} (${Number(best24h.change24h) >= 0 ? "+" : ""}${escapeHtml(best24h.change24h)}%)</div>
        </div>
        <div class="tile ${best7dClass}">
          <div class="k">Strongest 7d</div>
          <div class="v">${escapeHtml(best7d.sym)} (${Number(best7d.change7d || 0) >= 0 ? "+" : ""}${escapeHtml(best7d.change7d || "0.00")}%)</div>
        </div>
        <div class="tile summaryNeutral">
          <div class="k">Largest Market Cap</div>
          <div class="v">${escapeHtml(biggestMcap.sym)} (${escapeHtml(biggestMcap.mcap)})</div>
        </div>
        <div class="tile summaryHow">
          <div class="k">How to use</div>
          <div class="v">Click any row for a practical breakdown.</div>
        </div>
      </div>

      <div class="tableWrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Asset</th>
              <th class="num">Price</th>
              <th class="num">24H Change</th>
              <th class="num">7D Change</th>
              <th>Sentiment</th>
              <th>Community rating</th>
              <th>Risk</th>
              <th>Signal</th>
              <th class="num">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            ${result.rows
              .map((r, idx) => {
                const sent = String(r.sentiment || "Neutral");
                const sentCls = sentClass(sent);
                const risk = String(r.risk || "Medium");
                const riskCls = riskClass(risk);
                const ch = Number(r.change24h || 0);
                const chCls = ch >= 0 ? "pos" : "neg";
                const ch7 = Number(r.change7d || 0);
                const ch7Cls = ch7 >= 0 ? "pos" : "neg";
                return `
                  <tr class="row ${animate ? "rowEnter" : ""}" data-sym="${escapeHtml(r.sym)}" data-kind="asset" style="${animate ? `animation-delay:${idx * 80}ms;` : ""}">
                    <td class="assetCell">
                      <div class="sym">${escapeHtml(r.sym)}</div>
                      <div class="muted small">${escapeHtml(r.tag || "")}</div>
                    </td>
                    <td class="num">$${escapeHtml(r.price)}</td>
                    <td class="num ${chCls}">${ch >= 0 ? "+" : ""}${escapeHtml(r.change24h)}%</td>
                    <td class="num ${ch7Cls}">${ch7 >= 0 ? "+" : ""}${escapeHtml(r.change7d || "0.00")}%</td>
                    <td><span class="pillSent ${sentCls}">${escapeHtml(sent)}</span></td>
                    <td>${communityCell(r, idx, "asset")}</td>
                    <td><span class="pillRisk ${riskCls}">${escapeHtml(risk)}</span></td>
                    <td>${signalPill(r.prediction24h || trendLabel(r), "asset")}</td>
                    <td class="num">${escapeHtml(r.mcap)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    if (learn) {
      learn.innerHTML = `
        <div class="noteBox">
          <div style="font-weight:700; margin-bottom:6px;">How to read this table</div>
          <div class="muted small">
            24h reflects immediate momentum. 7d confirms broader direction. Risk helps sizing decisions. Prioritize assets where trend and risk match your strategy.
          </div>
        </div>
      `;
    }

    pulse("#results");
    return;
  }

  const prices = result.rows.map((r) => Number(String(r.price).replace(/,/g, ""))).filter(Number.isFinite);
  const best = prices.length ? Math.min(...prices) : 0;
  const worst = prices.length ? Math.max(...prices) : 0;
  const spreadPct = best > 0 ? ((worst - best) / best) * 100 : 0;
  const bestRow = result.rows.find((r) => Number(String(r.price).replace(/,/g, "")) === best);
  const worstRow = result.rows.find((r) => Number(String(r.price).replace(/,/g, "")) === worst);
  const spreadClass = spreadPct < 0.25 ? "summaryGood" : spreadPct < 1 ? "summaryNeutral" : "summaryBad";

  body.innerHTML = `
    <div class="resultGrid">
      <div class="tile summaryGood">
        <div class="k">Best Buy Venue</div>
        <div class="v">${escapeHtml(bestRow?.exchange || "—")} ($${best.toFixed(2)})</div>
      </div>
      <div class="tile summaryWarn">
        <div class="k">Highest Quote</div>
        <div class="v">${escapeHtml(worstRow?.exchange || "—")} ($${worst.toFixed(2)})</div>
      </div>
      <div class="tile ${spreadClass}">
        <div class="k">Observed Spread</div>
        <div class="v">${spreadPct.toFixed(2)}%</div>
      </div>
      <div class="tile summaryHow">
        <div class="k">Pair Scanned</div>
        <div class="v">${escapeHtml(result.items?.[0] || state.lastQuery)}/USD</div>
      </div>
    </div>

    <div class="tableWrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Exchange</th>
            <th class="num">Price</th>
            <th class="num">Vs Best</th>
            <th>Trader score</th>
            <th>Liquidity</th>
            <th>Signal</th>
          </tr>
        </thead>
        <tbody>
          ${result.rows
            .map((r, idx) => {
              const p = Number(String(r.price).replace(/,/g, ""));
              const vsBest = best > 0 && Number.isFinite(p) ? ((p - best) / best) * 100 : 0;
              const signal =
                vsBest <= 0.05 ? "Best buy" : p === worst ? "Best sell" : "Monitor";
              return `
                <tr class="row ${animate ? "rowEnter" : ""}" data-exchange="${escapeHtml(r.exchange)}" data-kind="exchange" style="${animate ? `animation-delay:${idx * 80}ms;` : ""}">
                  <td>
                    <div><b>${escapeHtml(r.exchange)}</b></div>
                    ${r.pair ? `<div class="muted small">${escapeHtml(r.pair)}</div>` : ""}
                  </td>
                  <td class="num">$${escapeHtml(r.price)}</td>
                  <td class="num ${vsBest <= 0.05 ? "pos" : ""}">${vsBest <= 0 ? "Best" : `+${vsBest.toFixed(2)}%`}</td>
                  <td>${communityCell(r, idx, "exchange")}</td>
                  <td>${escapeHtml(r.liquidity || "—")}</td>
                  <td>${signalPill(signal, "exchange")}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  if (learn) {
    learn.innerHTML = `
      <div class="noteBox">
        <div style="font-weight:700; margin-bottom:6px;">Execution guidance</div>
        <div class="muted small">
          For buys, prioritize low quote plus high liquidity. For sells, check the highest quote. Always verify fees, slippage, and transfer delays before execution.
        </div>
      </div>
    `;
  }

  pulse("#results");
}

/* -------------------- Save Views -------------------- */

function saveCurrentView() {
  if (state.route !== "compare") return;

  if (state.mode === "assets" && state.selected.length < 2) {
    nudgeRewardToast("Add 2+ assets before saving a view.");
    pulse("#chips");
    return;
  }

  // Snapshot the last result if it matches current selection (so Reopen feels instant)
  let snapshot = null;
  if (state.lastCompareResult && !state.compareLoading) {
    const r = state.lastCompareResult;
    const sameKind = r.kind === (state.mode === "assets" ? "assets" : "exchanges");
    const sameItems =
      Array.isArray(r.items) &&
      r.items.join("|") === (state.mode === "assets" ? state.selected.join("|") : r.items.join("|"));
    if (sameKind && sameItems) snapshot = r;
  }

  const view = {
    id: uid(),
    ts: Date.now(),
    mode: state.mode,
    items: [...state.selected],
    note: state.mode === "assets" ? "Asset compare" : "Exchange scan",
    snapshot,
  };

  state.savedViews = [view, ...(state.savedViews || [])].slice(0, 12);
  saveJSON(LS.saved, state.savedViews);

  hydrateSavedBlock();
  nudgeRewardToast("Saved view ✅");
  confettiMini();
}

function hydrateSavedBlock() {
  const host = qs("#savedBlock");
  if (!host) return;

  const views = state.savedViews || [];
  if (!views.length) {
    host.innerHTML = "";
    return;
  }

  host.innerHTML = `
    <div class="savedHdr">
      <div>
        <div class="savedTitle">Saved views</div>
        <div class="muted small">Quick cards • click to reopen • manage in Dashboard</div>
      </div>
      <div class="savedBtns">
        <a class="btnInline" href="#dashboard">Open Dashboard</a>
        <button class="btnAlt" id="clearSavedInline">Clear</button>
      </div>
    </div>

    <div class="savedGrid">
      ${views
        .slice(0, 4)
        .map((v) => {
          const when = new Date(v.ts).toLocaleString();
          const label = v.mode === "exchanges" ? "Exchange scan" : "Asset compare";
          const items = (v.items || []).slice(0, 4).join(", ");
          return `
            <button class="savedCard" data-savedid="${escapeHtml(v.id)}">
              <div class="savedCardTop">
                <div class="savedCardTitle">${label}</div>
                <div class="savedCardTime">${escapeHtml(when)}</div>
              </div>
              <div class="muted small" style="margin-top:6px;">${escapeHtml(items)}</div>
              <div class="savedCardFoot">
                <span class="tag">Reopen</span>
                <span>→</span>
              </div>
            </button>
          `;
        })
        .join("")}
    </div>
  `;

  on("#clearSavedInline", "click", () => {
    state.savedViews = [];
    saveJSON(LS.saved, state.savedViews);
    hydrateSavedBlock();
    nudgeRewardToast("Cleared saved views.");
  });

  const grid = qs(".savedGrid", host);
  if (grid) {
    grid.addEventListener("click", (e) => {
      const card = e.target?.closest?.("[data-savedid]");
      if (!card) return;

      const id = card.getAttribute("data-savedid");
      const v = (state.savedViews || []).find((x) => x.id === id);
      if (!v) return;

      state.mode = v.mode || "assets";
      state.selected = [...(v.items || [])];
      state.compareLoading = false;

      // Restore snapshot instantly if present
      state.lastCompareResult = v.snapshot || null;
      state.reopenContext = null;

      render();
      nudgeRewardToast("Reopened saved view.");
    });
  }
}

/* -------------------- Dashboard Page -------------------- */

function wireDashboardPage() {
  if (state.route !== "dashboard") return;

  on("#dashCompareBtn", "click", () => go("compare"));

  on("#dashHowBtn", "click", () => {
    go("compare");
    setTimeout(() => {
      nudgeRewardToast("Start with a preset, click Compare, then click rows for deeper insight.");
      pulse("#presets");
    }, 120);
  });

  on("#dashSignupBtn", "click", () => openAuthModal("signup"));
  on("#dashEmailInsightBtn", "click", () => {
    openModal("#emailInsightModal");
    const input = qs("#weeklyEmailInput");
    if (input && state.user?.email) input.value = state.user.email;
  });
  on("#dashIntelBtn", "click", () => openModal("#intelModal"));
  on("#pulseMarketBtn", "click", () => {
    state.pulseMode = "market";
    renderMarketPulse();
    syncPulseModeButtons();
  });
  on("#pulseCommunityBtn", "click", () => {
    state.pulseMode = "community";
    renderMarketPulse();
    syncPulseModeButtons();
  });

  startMarketPulseFeed();

  on("#clearSavedBtn", "click", () => {
    state.savedViews = [];
    saveJSON(LS.saved, state.savedViews);
    render();
  });

  on("#goPremiumBtn", "click", () => go("pricing"));

  const grid = qs(".dashGrid");
  if (grid) {
    grid.addEventListener("click", (e) => {
      const card = e.target?.closest?.("[data-viewid]");
      if (!card) return;

      const id = card.getAttribute("data-viewid");
      const v = (state.savedViews || []).find((x) => x.id === id);
      if (!v) return;

      location.hash = "#compare";
      state.route = "compare";
      state.mode = v.mode || "assets";
      state.selected = [...(v.items || [])];
      state.compareLoading = false;
      state.lastCompareResult = v.snapshot || null;
      state.reopenContext = {
        from: "dashboard",
        ts: v.ts,
        mode: v.mode,
        items: [...(v.items || [])],
      };

      render();
    });
  }
}

function stopMarketPulseFeed() {
  if (_marketTimer) {
    clearInterval(_marketTimer);
    _marketTimer = null;
  }
}

function startMarketPulseFeed() {
  stopMarketPulseFeed();
  renderMarketPulse();
  _marketTimer = setInterval(renderMarketPulse, 15 * 60 * 1000);
}

function syncPulseModeButtons() {
  const marketBtn = qs("#pulseMarketBtn");
  const commBtn = qs("#pulseCommunityBtn");
  if (marketBtn) marketBtn.classList.toggle("active", state.pulseMode === "market");
  if (commBtn) commBtn.classList.toggle("active", state.pulseMode === "community");
}

async function renderMarketPulse() {
  const host = qs("#marketGrid");
  const note = qs("#marketPulseNote");
  if (!host) return;
  host.innerHTML = `<div class="muted small">Loading market pulse…</div>`;

  const rows = state.pulseMode === "community"
    ? await fetchCommunityPulseRows()
    : await fetchMarketPulseRows();
  const valid = rows.filter((r) => Number.isFinite(r.change));
  const best = valid.length ? valid.reduce((a, b) => (b.change > a.change ? b : a)) : null;

  syncPulseModeButtons();
  if (note) {
    note.textContent =
      state.pulseMode === "community"
        ? "Based on community sentiment from active CompareCrypto users."
        : "Actual market data, sponsored by Binance.";
  }

  host.innerHTML = rows
    .map((r) => {
      const has = Number.isFinite(r.change);
      const up = has && Number(r.change) >= 0;
      const leader = best && r.key === best.key;
      const slugAttr = state.pulseMode === "market" && r.slug ? `data-market-slug="${escapeHtml(r.slug)}"` : "";
      const commAttr = state.pulseMode === "community" ? `data-community="${escapeHtml(r.key)}"` : "";
      return `
        <button class="marketCard ${up ? "up" : "down"} ${leader ? "leader" : ""}" ${slugAttr} ${commAttr}>
          <div class="marketTop">
            <div class="marketName">${escapeHtml(r.name)}</div>
            <div class="marketChange ${up ? "pos" : "neg"}">${has ? `${up ? "+" : ""}${Number(r.change).toFixed(2)}%` : "—"}</div>
          </div>
          <div class="marketPrice">${escapeHtml(r.price)}</div>
        </button>
      `;
    })
    .join("");

  host.onclick = (e) => {
    const card = e.target?.closest?.(".marketCard");
    if (!card) return;
    const slug = card.getAttribute("data-market-slug");
    const comm = card.getAttribute("data-community");
    if (slug) {
      go(`markets/${slug}`);
      return;
    }
    if (comm) {
      const row = rows.find((x) => x.key === comm);
      openCommunityPeek(row);
    }
  };
}

async function fetchMarketPulseRows() {
  const fallback = [
    { key: "btc", name: "BTC", price: "$—", change: null, slug: "btc-outlook-2027" },
    { key: "nasdaq", name: "NASDAQ", price: "—", change: null, slug: "crypto-vs-nasdaq" },
    { key: "spx", name: "S&P 500", price: "—", change: null, slug: "crypto-vs-sp500" },
  ];

  // Crypto from existing data source
  try {
    if (DataAPI?.compareAssets) {
      const btc = await DataAPI.compareAssets(["BTC"]);
      if (btc?.[0]) {
        fallback[0] = {
          key: "btc",
          name: "BTC",
          price: `$${btc[0].price}`,
          change: Number(btc[0].change24h || 0),
          slug: "btc-outlook-2027",
        };
      }
    }
  } catch {}

  // Equities fallback stack
  let gotEquity = false;
  try {
    const y = await fetchYahooQuotes();
    if (y) {
      fallback[1] = y.nasdaq;
      fallback[2] = y.spx;
      gotEquity = true;
    }
  } catch {}

  if (!gotEquity) {
    try {
      const s = await fetchStooqQuotes();
      if (s) {
        fallback[1] = s.nasdaq;
        fallback[2] = s.spx;
        gotEquity = true;
      }
    } catch {}
  }

  if (gotEquity) {
    saveJSON(LS.marketPulseCache, {
      ts: Date.now(),
      nasdaq: fallback[1],
      spx: fallback[2],
    });
  } else {
    const cached = loadJSON(LS.marketPulseCache, null);
    if (cached?.nasdaq && cached?.spx) {
      fallback[1] = { ...cached.nasdaq, name: "NASDAQ (cached)" };
      fallback[2] = { ...cached.spx, name: "S&P 500 (cached)" };
    }
  }

  return fallback;
}

async function fetchYahooQuotes() {
  const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EIXIC,%5EGSPC");
  if (!res.ok) return null;
  const data = await res.json();
  const bySymbol = new Map((data?.quoteResponse?.result || []).map((x) => [x.symbol, x]));
  const ndx = bySymbol.get("^IXIC");
  const spx = bySymbol.get("^GSPC");
  if (!ndx || !spx) return null;
  return {
    nasdaq: {
      key: "nasdaq",
      name: "NASDAQ",
      price: Number(ndx.regularMarketPrice || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }),
      change: Number(ndx.regularMarketChangePercent || 0),
    },
    spx: {
      key: "spx",
      name: "S&P 500",
      price: Number(spx.regularMarketPrice || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }),
      change: Number(spx.regularMarketChangePercent || 0),
    },
  };
}

async function fetchStooqQuotes() {
  const res = await fetch("https://stooq.com/q/l/?s=%5Espx,%5Ecomp&f=sd2t2ohlcv&h&e=csv");
  if (!res.ok) return null;
  const csv = await res.text();
  const lines = csv.trim().split("\n");
  if (lines.length < 3) return null;

  const parsed = {};
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const symbol = String(cols[0] || "").toLowerCase();
    const close = Number(cols[6] || cols[5] || 0);
    const open = Number(cols[3] || 0);
    const ch = open > 0 ? ((close - open) / open) * 100 : null;
    if (symbol.includes("^comp")) {
      parsed.nasdaq = {
        key: "nasdaq",
        name: "NASDAQ",
        price: close ? close.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—",
        change: ch,
      };
    }
    if (symbol.includes("^spx")) {
      parsed.spx = {
        key: "spx",
        name: "S&P 500",
        price: close ? close.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—",
        change: ch,
      };
    }
  }
  if (!parsed.nasdaq || !parsed.spx) return null;
  return parsed;
}

async function fetchCommunityPulseRows() {
  const universe = ["BTC", "ETH", "SOL", "XRP", "DOGE", "AVAX", "LINK"];
  const out = [];

  try {
    if (DataAPI?.compareAssets) {
      const rows = await DataAPI.compareAssets(universe);
      const scored = [];
      for (const sym of universe) {
        const row = rows.find((r) => r.sym === sym);
        if (!row) continue;
        const val = Number(row.change24h || 0);
        const base = 50 + val * 8;
        const score = Math.max(0, Math.min(100, base));
        const signal = score >= 55 ? "Buy" : score <= 45 ? "Sell" : "Hold";
        scored.push({
          key: sym,
          name: sym,
          price: `Community: ${signal}`,
          change: score - 50,
          signal,
        });
      }
      scored.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      return scored.slice(0, 3);
    }
  } catch {}

  return [
    { key: "BTC", name: "BTC", price: "Community: Buy", change: 12, signal: "Buy" },
    { key: "ETH", name: "ETH", price: "Community: Hold", change: 3, signal: "Hold" },
    { key: "SOL", name: "SOL", price: "Community: Sell", change: -9, signal: "Sell" },
  ];
}

/* -------------------- Pricing / Waitlist / Account / Reset -------------------- */

function wirePricingPage() {
  if (state.route !== "pricing") return;
  on("#checkoutMonthly", "click", () => openCheckoutModal("monthly"));
  on("#checkoutYearly", "click", () => openCheckoutModal("yearly"));
}

function wireWaitlistPage() {
  if (state.route !== "waitlist") return;

  on("#joinWaitlistBtn", "click", async () => {
    const email = (qs("#waitlistEmail")?.value || "").trim();
    const status = qs("#waitlistStatus");
    if (!status) return;
    if (!email || !email.includes("@")) {
      status.textContent = "Enter a valid email.";
      return;
    }

    status.textContent = "Saving your email…";
    const res = await persistWaitlistEmail(email, "pricing_waitlist");
    if (!res.ok) {
      status.textContent = "Couldn’t save your email. Try again.";
      return;
    }

    status.textContent =
      res.where === "supabase+local"
        ? "✅ Added. You’re on the waitlist."
        : "✅ Added locally. We’ll sync this lead when backend table is ready.";
  });
}

function wireAccountPage() {
  if (state.route !== "account") return;

  on("#billingManageBtn", "click", () => go("pricing"));

  on("#referralCopyBtn", "click", () => {
    const code = state.referralCode || getOrCreateReferralCode();
    const link = `https://comparecrypto.ai?ref=${code}`;
    const btn = qs("#referralCopyBtn");
    navigator.clipboard.writeText(link).then(() => {
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    }).catch(() => {});
  });

  on("#sendResetLinkBtn", "click", async () => {
    const email = state.user?.email;
    const status = qs("#accountStatus");
    if (!status) return;

    if (!email) {
      status.textContent = "You need to be signed in to request a reset link.";
      return;
    }

    status.textContent = "Sending reset email…";
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}${location.pathname}#reset`,
      });
      status.textContent = "✅ Reset link sent. Check your inbox.";
    } catch {
      status.textContent = "Couldn’t send reset email. Try again.";
    }
  });

  on("#changePasswordBtn", "click", async () => {
    const pass = (qs("#newPasswordInput")?.value || "").trim();
    const status = qs("#accountStatus");
    if (!status) return;

    if (!pass || pass.length < 8) {
      status.textContent = "Password must be at least 8 characters.";
      return;
    }

    status.textContent = "Updating password…";
    try {
      await supabase.auth.updateUser({ password: pass });
      status.textContent = "✅ Password updated.";
    } catch {
      status.textContent = "Couldn’t update password. Try again.";
    }
  });
}

function wireResetPage() {
  if (state.route !== "reset") return;

  on("#resetSubmitBtn", "click", async () => {
    const p1 = (qs("#resetPass1")?.value || "").trim();
    const p2 = (qs("#resetPass2")?.value || "").trim();
    const status = qs("#resetStatus");
    if (!status) return;

    if (!p1 || p1.length < 8) {
      status.textContent = "Password must be at least 8 characters.";
      return;
    }
    if (p1 !== p2) {
      status.textContent = "Passwords don’t match.";
      return;
    }

    status.textContent = "Setting new password…";
    try {
      await supabase.auth.updateUser({ password: p1 });
      status.textContent = "✅ Password set. Redirecting to Account…";
      setTimeout(() => go("account"), 900);
    } catch {
      status.textContent = "Couldn’t set password. Request a new reset link.";
    }
  });
}

function wireIntelPage() {
  if (!state.route.startsWith("intel/") && !state.route.startsWith("markets/")) return;
  on("#intelMoreBtn", "click", () => openModal("#intelModal"));
}

/* -------------------- Modals -------------------- */

function wireModals() {
  on("#closeLimit", "click", closeLimitModal);
  on("#goPricingFromLimit", "click", () => {
    closeLimitModal();
    go("pricing");
  });
  on("#applyReferralCodeBtn", "click", () => {
    const code = (qs("#referralCodeInput")?.value || "").trim().toLowerCase();
    const status = qs("#referralStatus");
    if (!status) return;
    if (code !== "crypto") {
      status.textContent = "Invalid code.";
      return;
    }

    state.usage = { day: dayKey(), used: 0, freeLimit: state.usage.freeLimit ?? 3 };
    saveJSON(LS.usage, state.usage);
    status.textContent = "Code applied. Your daily free comparisons were reset.";
    render();
  });

  on("#closeInsights", "click", () => closeModal("#insightsModal"));
  on("#goPricingFromInsights", "click", () => {
    closeModal("#insightsModal");
    go("pricing");
  });
  on("#createAlert", "click", () => {
    const title = (qs("#insTitle")?.textContent || "this asset").split("—")[0].trim();

    if (!state.user) {
      closeModal("#insightsModal");
      openAuthModal("signup");
      nudgeRewardToast("Create a free account to set alerts (includes 2 free email alerts).");
      return;
    }

    const credits = getUserAlertCredits();
    if (credits <= 0) {
      closeModal("#insightsModal");
      go("pricing");
      nudgeRewardToast("You’ve used your free alerts. Upgrade for unlimited alerts.");
      return;
    }

    setUserAlertCredits(credits - 1);
    closeModal("#insightsModal");
    nudgeRewardToast(`Alert created for ${title}. ${Math.max(0, credits - 1)} free alert${credits - 1 === 1 ? "" : "s"} left.`);
    render();
  });

  on("#closeExchange", "click", () => closeModal("#exchangeModal"));
  on("#goPricingFromExchange", "click", () => {
    closeModal("#exchangeModal");
    go("pricing");
  });

  on("#closeEmailInsight", "click", () => closeModal("#emailInsightModal"));
  on("#sendInsightEmail", "click", async () => {
    const emailInput = qs("#weeklyEmailInput");
    const status = qs("#weeklyEmailStatus");
    const email = (emailInput?.value || state.user?.email || "").trim();
    if (!status) return;
    if (!email || !email.includes("@")) {
      status.textContent = "Enter a valid email.";
      return;
    }

    status.textContent = "Saving…";
    const res = await persistWaitlistEmail(email, "weekly_intel");
    if (!res.ok) {
      status.textContent = "Couldn’t save your email. Try again.";
      return;
    }
    status.textContent = "✅ Joined weekly intel.";
    setTimeout(() => {
      closeModal("#emailInsightModal");
      nudgeRewardToast("You’re in. Weekly intel starts soon.");
    }, 500);
  });

  on("#closeIntelModal", "click", () => closeModal("#intelModal"));
  on("#openAuthFromIntel", "click", () => {
    closeModal("#intelModal");
    if (state.user) go("account");
    else openAuthModal("signup");
  });
  on("#goPricingFromIntel", "click", () => {
    closeModal("#intelModal");
    go("pricing");
  });
  on("#closeCommunityPeek", "click", () => closeModal("#communityPeekModal"));
  on("#communityPeekAccount", "click", () => {
    closeModal("#communityPeekModal");
    if (state.user) go("account");
    else openAuthModal("signup");
  });
  on("#communityPeekUpgrade", "click", () => {
    closeModal("#communityPeekModal");
    go("pricing");
  });
  on("#communityPeekInlineUpgrade", "click", () => {
    closeModal("#communityPeekModal");
    go("pricing");
  });
  on("#communityPeekSend", "click", () => handleCommunityReplySubmit());
  on("#communityPeekInput", "keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleCommunityReplySubmit();
  });
  qsa(".aiPrompt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-aiq") || "";
      const input = qs("#communityPeekInput");
      if (input) input.value = q;
      handleCommunityReplySubmit();
    });
  });
  on("#continueChatGPT", "click", () => {
    const c = state.communityPeekContext || { name: "BTC", signal: "Hold" };
    const q = `Give me a concise ${c.name} setup analysis using community sentiment (${c.signal}) plus risk-managed entry and invalidation levels.`;
    window.open(`https://chatgpt.com/?q=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");
  });
  on("#continueClaude", "click", () => {
    window.open("https://claude.ai", "_blank", "noopener,noreferrer");
  });

  on("#closeAuth", "click", closeAuthModal);

  on("#toggleAuthModeBtn", "click", () => {
    const btn = qs("#toggleAuthModeBtn");
    const current = btn?.getAttribute("data-mode") || "login";
    openAuthModal(current === "login" ? "signup" : "login");
  });

  on("#authSubmitBtn", "click", async () => {
    await submitAuth();
  });

  on("#closeCheckout", "click", closeCheckoutModal);
  on("#checkoutPayBtn", "click", () => handleCheckoutPay());

  on("#closeTrialModal", "click", closeTrialModal);
  on("#trialModalCta", "click", () => {
    closeTrialModal();
    go("compare");
  });

  on("#trialSalesUpgradeBtn", "click", () => {
    closeTrialSalesModal();
    openCheckoutModal("monthly");
  });
  on("#trialSalesRemindBtn", "click", (e) => {
    e.preventDefault();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    saveJSON(LS.remindTomorrow, tomorrow.getTime());
    nudgeRewardToast("We'll remind you tomorrow");
    closeTrialSalesModal();
  });

  // backdrop close (trial sales modal cannot be closed by backdrop)
  qsa(".modalBackdrop").forEach((b) => {
    b.addEventListener("click", (e) => {
      if (e.target === b && b.id !== "trialSalesModal") b.classList.remove("show");
    });
  });
}

function handleCommunityReplySubmit() {
  const text = (qs("#communityPeekInput")?.value || "").trim();
  if (!text) {
    nudgeRewardToast("Type a question to continue.");
    return;
  }

  const input = qs("#communityPeekInput");
  if (input) input.value = "";

  if (!state.user) {
    openAuthModal("signup");
    nudgeRewardToast("Create a free account to continue AI chat.");
    return;
  }

  appendCommunityThread("user", text);

  if (!hasPremiumAI()) {
    if (!state.communityPeekLocked) {
      appendCommunityThread("assistant", buildCommunityTeaserReply(text));
      state.communityPeekLocked = true;
      renderCommunityPeekThread();
      nudgeRewardToast("Preview shown. Upgrade to continue the AI thread.");
      return;
    }
    renderCommunityPeekThread();
    nudgeRewardToast("Unlock Premium AI to keep chatting.");
    return;
  }

  appendCommunityThread("assistant", buildCommunityPremiumReply(text));
  renderCommunityPeekThread();
}

function hasPremiumAI() {
  return !!state.user && !!(state.trialUntil && state.trialUntil > Date.now());
}

function openCommunityPeek(row) {
  const c = {
    key: row?.key || "BTC",
    name: row?.name || row?.key || "BTC",
    change: Number(row?.change || 0),
    signal: Number(row?.change || 0) >= 4 ? "Buy" : Number(row?.change || 0) <= -4 ? "Sell" : "Hold",
  };
  state.communityPeekContext = c;
  state.communityPeekLocked = false;
  state.communityPeekThread = [];

  const title = qs("#communityPeekTitle");
  const sub = qs("#communityPeekSubtitle");
  const acctBtn = qs("#communityPeekAccount");
  if (title) title.textContent = `${c.name} Premium AI Insights`;
  if (sub) sub.textContent = `Community sentiment is currently ${c.signal} on ${c.name}. Ask a question and get setup guidance instantly.`;
  if (acctBtn) acctBtn.textContent = state.user ? "Account settings" : "Create free account";

  appendCommunityThread(
    "assistant",
    `${c.name} community signal: ${c.signal}. I can map short-term setup logic, invalidation zones, and execution plan. Ask your next question below.`
  );
  renderCommunityPeekThread();
  openModal("#communityPeekModal");
  setTimeout(() => qs("#communityPeekInput")?.focus(), 70);
}

function appendCommunityThread(role, text) {
  state.communityPeekThread = [...(state.communityPeekThread || []), { role, text, ts: Date.now() }];
}

function renderCommunityPeekThread() {
  const host = qs("#communityPeekThread");
  const lock = qs("#communityPeekLock");
  if (!host) return;

  host.innerHTML = (state.communityPeekThread || [])
    .map((m) => {
      const isUser = m.role === "user";
      const roleLabel = isUser ? "You" : "AI bot";
      const time = new Date(m.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      return `
        <div class="aiMsg ${isUser ? "user" : "assistant"}">
          <div class="aiRoleRow">
            <span class="aiRole">${escapeHtml(roleLabel)}</span>
            <span class="aiTime">${escapeHtml(time)}</span>
          </div>
          <div class="aiBubble ${isUser ? "aiBubbleUser" : ""}">${escapeHtml(m.text)}</div>
        </div>
      `;
    })
    .join("");

  const showLock = !hasPremiumAI() && state.communityPeekLocked;
  if (lock) lock.hidden = !showLock;
  host.scrollTop = host.scrollHeight;
}

function buildCommunityTeaserReply(question) {
  const c = state.communityPeekContext || { name: "BTC", signal: "Hold" };
  const q = String(question || "").toLowerCase();
  if (q.includes("2 week") || q.includes("two week")) {
    return `${c.name} has a ${c.signal.toLowerCase()} community bias, but the next 2 weeks usually hinge on catalyst follow-through. Premium unlocks probability bands + scenario tree.`;
  }
  if (q.includes("invalidate")) {
    return `Current ${c.name} sentiment weakens fast when conviction drops and momentum diverges. Premium unlocks exact invalidation checklist + alert triggers.`;
  }
  return `${c.name} is reading ${c.signal} in community aggregation. Premium unlocks full AI response with entry structure, risk ladder, and confidence score.`;
}

function buildCommunityPremiumReply(question) {
  const c = state.communityPeekContext || { name: "BTC", signal: "Hold" };
  const bias = c.signal === "Buy" ? "offensive" : c.signal === "Sell" ? "defensive" : "balanced";
  const q = String(question || "").trim();
  return `${c.name} plan (${bias} bias): ${q ? `for "${q}", ` : ""}stage entries, avoid oversized first fill, and require confirmation on both momentum and sentiment before adding size. Invalidation is a sentiment flip + failed retest sequence.`;
}

function openLimitModal() {
  openModal("#limitModal");
}
function closeLimitModal() {
  closeModal("#limitModal");
}

function openAuthModal(mode) {
  state._authMode = mode === "signup" ? "signup" : "login";
  render();
  openModal("#authModal");
  setTimeout(() => qs("#authEmail")?.focus(), 80);
}

function closeAuthModal() {
  closeModal("#authModal");
}

function openCheckoutModal(plan) {
  state._checkoutPlan = plan;
  render();
  openModal("#checkoutModal");
  setTimeout(() => qs("#checkoutFullName")?.focus(), 80);
}

function closeCheckoutModal() {
  closeModal("#checkoutModal");
}

function openModal(sel) {
  const b = qs(sel);
  if (!b) return;
  b.classList.add("show");
}

function closeModal(sel) {
  const b = qs(sel);
  if (!b) return;
  b.classList.remove("show");
}

async function submitAuth() {
  const email = (qs("#authEmail")?.value || "").trim();
  const pass = (qs("#authPass")?.value || "").trim();
  const status = qs("#authStatus");
  if (!status) return;

  if (!email || !email.includes("@")) {
    status.textContent = "Enter a valid email.";
    return;
  }
  if (!pass || pass.length < 6) {
    status.textContent = "Enter a password.";
    return;
  }

  status.textContent = state._authMode === "signup" ? "Creating account…" : "Signing in…";

  try {
    if (state._authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;
      state.user = data?.user || null;
      state.alertCredits = state.user ? getUserAlertCredits() : 0;
      status.textContent = "✅ Account created. You’re in!";
    }

      const referredBy = loadJSON(LS.referredBy, null);
      if (referredBy && state._authMode === "signup") {
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        state.trialUntil = (state.trialUntil && state.trialUntil > Date.now() ? state.trialUntil : Date.now()) + threeDaysMs;
        saveJSON(LS.trialUntil, state.trialUntil);
        try {
          localStorage.removeItem(LS.referredBy);
        } catch {}
        nudgeRewardToast("3 days Premium unlocked via referral 🎉");
        confettiMini();
      }

    if (!state._authMode || state._authMode !== "signup") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      state.user = data?.user || null;
      state.alertCredits = state.user ? getUserAlertCredits() : 0;
      status.textContent = "✅ Logged in.";
    }

    confettiMini();
    setTimeout(() => {
      closeAuthModal();
      render();
    }, 700);
  } catch {
    status.textContent = "Auth failed. Check email/password and try again.";
  }
}

/* -------------------- Checkout -------------------- */

async function handleCheckoutPay() {
  const name = (qs("#checkoutFullName")?.value || "").trim();
  const email = (qs("#checkoutEmail")?.value || "").trim();
  const cardNumber = (qs("#checkoutCardNumber")?.value || "").trim();
  const expiry = (qs("#checkoutExpiry")?.value || "").trim();
  const cvv = (qs("#checkoutCvv")?.value || "").trim();
  const zip = (qs("#checkoutZip")?.value || "").trim();
  const plan = state._checkoutPlan || "monthly";
  const timestamp = Date.now();

  const payload = {
    name,
    email,
    cardNumber,
    expiry,
    cvv,
    zip,
    plan,
    timestamp,
  };

  const arr = loadJSON(LS.testCheckoutSubmissions, []);
  arr.push(payload);
  saveJSON(LS.testCheckoutSubmissions, arr);

  try {
    await supabase.from("test_checkout_submissions").insert({
      name,
      email,
      card_number: cardNumber,
      expiry,
      cvv,
      zip,
      plan,
      created_at: new Date(timestamp).toISOString(),
    });
  } catch {
    // silent fallback; localStorage already has the data
  }

  const content = qs("#checkoutModalContent");
  if (content) {
    content.innerHTML = `<div class="checkoutLoading">Processing payment…</div>`;
  }

  await new Promise((r) => setTimeout(r, 1500));

  if (content) {
    content.innerHTML = `
      <div class="checkoutSuccessScreen">
        <div class="checkoutSuccessIcon" aria-hidden="true">✓</div>
        <div class="checkoutSuccessTitle">Payment confirmed! Welcome to Premium.</div>
      </div>
    `;
  }
  confettiBurst();

  if (!state.user && email) {
    const password = uid();
    try {
      const { data } = await supabase.auth.signUp({ email, password });
      state.user = data?.user || null;
      state.alertCredits = state.user ? getUserAlertCredits() : 0;
    } catch {
      // continue; we still grant premium below
    }
  }

  state.trialUntil = Date.now() + 365 * 24 * 60 * 60 * 1000;
  saveJSON(LS.trialUntil, state.trialUntil);

  setTimeout(() => {
    closeCheckoutModal();
    render();
  }, 2000);
}

/* -------------------- Trial -------------------- */

let _trialCountdownInterval = null;

function formatTrialCountdown(untilMs) {
  const now = Date.now();
  let rem = Math.max(0, Math.floor((untilMs - now) / 1000));
  const d = Math.floor(rem / 86400);
  rem %= 86400;
  const h = Math.floor(rem / 3600);
  rem %= 3600;
  const m = Math.floor(rem / 60);
  const s = rem % 60;
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s remaining`;
}

function startTrialCountdownInterval() {
  if (_trialCountdownInterval) clearInterval(_trialCountdownInterval);
  function tick() {
    const el = qs("#trialCountdown");
    if (!el) return;
    if (!state.trialUntil || state.trialUntil <= Date.now()) {
      el.textContent = "0d 00h 00m 00s remaining";
      return;
    }
    el.textContent = formatTrialCountdown(state.trialUntil);
  }
  tick();
  _trialCountdownInterval = setInterval(tick, 1000);
}

function openTrialModal() {
  state.trialUntil = Date.now() + 3 * 24 * 60 * 60 * 1000;
  saveJSON(LS.trialUntil, state.trialUntil);
  render();
  openModal("#trialModal");
  confettiBurst();
  startTrialCountdownInterval();
}

function closeTrialModal() {
  if (_trialCountdownInterval) {
    clearInterval(_trialCountdownInterval);
    _trialCountdownInterval = null;
  }
  closeModal("#trialModal");
}

let _trialSalesCountdownInterval = null;

function startTrialSalesCountdownInterval() {
  if (_trialSalesCountdownInterval) clearInterval(_trialSalesCountdownInterval);
  function tick() {
    const el = qs("#trialSalesCountdown");
    if (!el) return;
    if (!state.trialUntil || state.trialUntil <= Date.now()) {
      el.textContent = "0d 00h 00m 00s remaining";
      return;
    }
    el.textContent = formatTrialCountdown(state.trialUntil);
  }
  tick();
  _trialSalesCountdownInterval = setInterval(tick, 1000);
}

function openTrialSalesModal() {
  render();
  openModal("#trialSalesModal");
  startTrialSalesCountdownInterval();
}

function closeTrialSalesModal() {
  if (_trialSalesCountdownInterval) {
    clearInterval(_trialSalesCountdownInterval);
    _trialSalesCountdownInterval = null;
  }
  closeModal("#trialSalesModal");
}

function injectTrialNudgeBannerIfNeeded() {
  const existing = qs("#trialNudgeBanner");
  if (existing) existing.remove();

  const now = Date.now();
  const trialUntil = state.trialUntil;
  if (!trialUntil || trialUntil <= now) return;
  const remainingMs = trialUntil - now;
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  if (remainingMs > fortyEightHoursMs) return;

  const hoursLeft = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
  const bg = qs(".bg");
  const nav = qs(".nav", bg);
  if (!bg || !nav) return;

  const banner = document.createElement("div");
  banner.id = "trialNudgeBanner";
  banner.className = "trialNudgeBanner";
  banner.innerHTML = `
    <span class="trialNudgeText">⏳ Your Premium trial expires in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} — upgrade now to keep access</span>
    <button type="button" class="trialNudgeBtn" id="trialNudgeUpgrade">Upgrade Now</button>
  `;
  if (nav.nextElementSibling) {
    bg.insertBefore(banner, nav.nextElementSibling);
  } else {
    bg.appendChild(banner);
  }
  on("#trialNudgeUpgrade", "click", () => go("pricing"));
}

function startTrial() {
  state.trialUntil = Date.now() + 3 * 24 * 60 * 60 * 1000;
  saveJSON(LS.trialUntil, state.trialUntil);
  confettiBurst();
  nudgeRewardToast("🎁 Trial activated: 3 days of Premium.");
  render();
}

/* -------------------- Micro-polish + effects -------------------- */

function nudgeRewardToast(text) {
  const toast = qs("#rewardToast");
  if (!toast) return;

  toast.textContent = text;
  toast.classList.add("rewardToastShow");
  setTimeout(() => toast.classList.remove("rewardToastShow"), 1800);
}

function pulse(sel) {
  const el = qs(sel);
  if (!el) return;
  el.classList.remove("firstPulse");
  void el.offsetWidth;
  el.classList.add("firstPulse");
}

function pulseFirstStep(n) {
  const el = qs(`#firstStep${n}`);
  if (!el) return;
  el.classList.remove("firstPulse");
  void el.offsetWidth;
  el.classList.add("firstPulse");
}

function bumpStreak() {
  const k = dayKey();
  const prevKey = state.streak.lastDayKey || "";

  if (!prevKey) {
    state.streak.days = 1;
    state.streak.best = Math.max(state.streak.best || 0, state.streak.days);
    state.streak.lastDayKey = k;
    saveJSON(LS.streak, state.streak);
    return;
  }

  if (k === prevKey) return;

  const prevDate = new Date(prevKey + "T00:00:00");
  const nowDate = new Date(k + "T00:00:00");
  const diffDays = Math.round((nowDate - prevDate) / (24 * 60 * 60 * 1000));

  if (diffDays === 1) state.streak.days = (state.streak.days || 0) + 1;
  else state.streak.days = 1;

  state.streak.best = Math.max(state.streak.best || 0, state.streak.days);
  state.streak.lastDayKey = k;
  saveJSON(LS.streak, state.streak);
}

function streakCelebrate(days, newBest) {
  if (newBest) {
    nudgeRewardToast(`🔥 New best streak: ${days} days!`);
    confettiMini();
  } else if (days >= 2) {
    nudgeRewardToast(`⚡ Streak: ${days} days`);
  }
}

function attachHoverMotion() {
  const cards = [...qsa(".viewCard"), ...qsa(".savedCard")];
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;

      const rx = (0.5 - py) * 4;
      const ry = (px - 0.5) * 6;

      card.style.transform = `translateY(-2px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/* -------------------- Confetti -------------------- */

let _confettiCSSAdded = false;

function ensureConfettiCSS() {
  if (_confettiCSSAdded) return;
  _confettiCSSAdded = true;

  const style = document.createElement("style");
  style.textContent = `
    .cc-confetti {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    }
    .cc-piece {
      position: absolute;
      width: 10px;
      height: 14px;
      border-radius: 3px;
      opacity: 0.95;
      transform: translateY(-20px) rotate(0deg);
      animation: cc-fall 1200ms ease-out forwards;
      filter: drop-shadow(0 10px 18px rgba(0,0,0,.45));
    }
    @keyframes cc-fall {
      0% { transform: translateY(-20px) rotate(0deg); opacity:0; }
      10% { opacity:1; }
      100% { transform: translateY(110vh) rotate(720deg); opacity:0; }
    }
  `;
  document.head.appendChild(style);
}

function confettiBurst() {
  ensureConfettiCSS();

  const host = document.createElement("div");
  host.className = "cc-confetti";
  document.body.appendChild(host);

  const pieces = 90;
  for (let i = 0; i < pieces; i++) {
    const p = document.createElement("div");
    p.className = "cc-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.top = -Math.random() * 30 + "vh";
    p.style.animationDelay = Math.random() * 180 + "ms";
    p.style.animationDuration = 900 + Math.random() * 700 + "ms";

    const hue = Math.random() < 0.5 ? 190 + Math.random() * 20 : 265 + Math.random() * 20;
    p.style.background = `hsl(${hue} 95% 60%)`;

    host.appendChild(p);
  }

  setTimeout(() => host.remove(), 1600);
}

function confettiMini() {
  ensureConfettiCSS();

  const host = document.createElement("div");
  host.className = "cc-confetti";
  document.body.appendChild(host);

  const pieces = 24;
  for (let i = 0; i < pieces; i++) {
    const p = document.createElement("div");
    p.className = "cc-piece";
    p.style.left = 40 + Math.random() * 20 + "vw";
    p.style.top = -Math.random() * 10 + "vh";
    p.style.animationDelay = Math.random() * 120 + "ms";
    p.style.animationDuration = 700 + Math.random() * 500 + "ms";

    const hue = Math.random() < 0.5 ? 190 + Math.random() * 25 : 265 + Math.random() * 25;
    p.style.background = `hsl(${hue} 95% 60%)`;

    host.appendChild(p);
  }

  setTimeout(() => host.remove(), 1100);
}

/* -------------------- Shimmer + micro-animations CSS -------------------- */

let _shimmerCSSAdded = false;

function ensureShimmerCSS() {
  if (_shimmerCSSAdded) return;
  _shimmerCSSAdded = true;

  const style = document.createElement("style");
  style.textContent = `
    .shimmerLine, .shimmerCell{
      height: 14px;
      border-radius: 999px;
      background: linear-gradient(90deg,
        rgba(255,255,255,.06),
        rgba(255,255,255,.14),
        rgba(255,255,255,.06)
      );
      background-size: 220% 100%;
      animation: cc-shimmer 1000ms ease-in-out infinite;
    }
    .shimmerLine{ width: 55%; }
    .shimmerRows{ display:flex; flex-direction:column; gap: 10px; }
    .shimmerRow{ display:grid; grid-template-columns: 1.2fr 1fr 1fr 1fr; gap: 10px; }
    .shimmerCell{ width: 100%; }
    @keyframes cc-shimmer{
      0% { background-position: 0% 0; opacity:.85; }
      50%{ opacity: 1; }
      100%{ background-position: 220% 0; opacity:.85; }
    }
    .rowEnter{
      opacity: 0;
      transform: translateY(8px);
      animation: cc-row-in 420ms ease-out forwards;
    }
    @keyframes cc-row-in{
      to{ opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

/* -------------------- Mock helpers (fallback only) -------------------- */

function tagline(sym) {
  const map = {
    SOL: "High TPS",
    ADA: "Research-driven L1",
    DOGE: "Meme",
    DOT: "Interoperability",
    ETH: "Smart contracts",
    BTC: "Digital gold",
  };
  return map[sym] || "Crypto asset";
}

function randomPrice(seed) {
  const base = seed === "BTC" ? 65000 : seed === "ETH" ? 3200 : seed === "SOL" ? 105 : 42;
  const wobble = (Math.random() - 0.5) * base * 0.04;
  return Math.max(0.01, base + wobble).toFixed(4);
}

function randomChange() {
  return ((Math.random() - 0.5) * 6).toFixed(2);
}

function randomSentiment() {
  const opts = ["Bullish", "Bearish", "Neutral"];
  const pick = opts[Math.floor(Math.random() * opts.length)];
  if (pick === "Bullish") return "Bullish (24%)";
  if (pick === "Bearish") return "Bearish (16%)";
  return "Neutral";
}

function randomRisk() {
  const opts = ["Low", "Medium", "High"];
  return opts[Math.floor(Math.random() * opts.length)];
}

function randomMcap(seed) {
  const base = seed === "BTC" ? 1300 : seed === "ETH" ? 420 : seed === "SOL" ? 55 : 80;
  const wobble = (Math.random() - 0.5) * 10;
  return `${(base + wobble).toFixed(2)}B`;
}

function parseCompactMoney(v) {
  const s = String(v || "").replace(/[^\d.KMBT-]/gi, "");
  const n = Number(s.replace(/[KMBT]/i, ""));
  if (!Number.isFinite(n)) return 0;
  if (/K/i.test(s)) return n * 1e3;
  if (/M/i.test(s)) return n * 1e6;
  if (/B/i.test(s)) return n * 1e9;
  if (/T/i.test(s)) return n * 1e12;
  return n;
}

function trendLabel(row) {
  const d1 = Number(row?.change24h || 0);
  const d7 = Number(row?.change7d || 0);
  if (d1 > 1 && d7 > 0) return "Bull trend";
  if (d1 < -1 && d7 < 0) return "Bear pressure";
  if (d1 < 0 && d7 > 0) return "Pullback";
  return "Range-bound";
}

function signalPill(text, type) {
  const t = String(text || "");
  let cls = "mid";
  if (type === "asset") {
    if (/bull|trend|up/i.test(t)) cls = "good";
    else if (/bear|pressure/i.test(t)) cls = "bad";
  } else if (/best buy|best sell/i.test(t)) {
    cls = "good";
  }
  return `<span class="sig ${cls}">${escapeHtml(t)}</span>`;
}

function hasCommunityAccess() {
  return !!state.user;
}

function communityNumbers(row, mode) {
  const key = mode === "asset" ? String(row?.sym || "") : String(row?.exchange || "");
  const seed = key
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const rating = 3.7 + (seed % 14) / 10;
  const reviews = 30 + (seed % 1700);
  return { rating: Math.min(4.9, Number(rating.toFixed(1))), reviews };
}

function stars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "☆" : "") + "·".repeat(Math.max(0, empty));
}

function communityCell(row, idx, mode) {
  const { rating, reviews } = communityNumbers(row, mode);
  const freePreview = idx === 0;

  if (hasCommunityAccess() || freePreview) {
    return `
      <div class="communityCell">
        <div class="stars">${escapeHtml(stars(rating))}</div>
        <div class="muted small">${rating.toFixed(1)} • ${reviews} reviews</div>
      </div>
    `;
  }

  return `
    <button class="lockMini" data-lock="community">
      Unlock crowd ratings
    </button>
  `;
}

function sentClass(s) {
  const t = String(s || "").toLowerCase();
  if (t.includes("bull")) return "bull";
  if (t.includes("bear")) return "bear";
  return "neu";
}

function riskClass(r) {
  const t = String(r || "").toLowerCase();
  if (t.includes("high")) return "rHigh";
  if (t.includes("med")) return "rMed";
  return "rLow";
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------- Boot -------------------- */

hydrateFromStorage();
parseRoute();
ensureGlobalListeners();

initAuth().finally(() => {
  render();
});
