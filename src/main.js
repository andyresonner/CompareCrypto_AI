// Import styles
import "./styles.css";

import { App } from "./app.js";
import { canCompare, incrementUsage, getUsage, resetDemoUsage } from "./usage.js";
import { supabase } from "./supabase.js";

const SAVE_KEY = "cc_saved_views_v1";
const FIRST_KEY = "cc_first_compare_done_v1";

// Gamification keys
const STREAK_KEY = "cc_streak_v1";
const LIFETIME_KEY = "cc_lifetime_compares_v1";
const TRIAL_KEY = "cc_trial_until_v1";
const INSIGHT_KEY = "cc_insight_rewarded_v1";

// Auth UX key (remember last email typed)
const LAST_EMAIL_KEY = "cc_last_auth_email_v1";

const state = {
  route: routeFromHash(),
  mode: "assets",
  selected: [],
  usage: getUsage(),
  exchangeAsset: "BTC",
  savedViews: loadSavedViews(),
  user: null,
  lastAction: null,
  firstCompareDone: getFirstCompareDone(),
  usageBumped: false,

  // Gamification state
  streak: loadStreak(),
  lifetimeCompares: loadLifetimeCompares(),
  trialUntil: loadTrialUntil(),
  insightRewarded: loadInsightRewarded(),
  level: 1,
};

state.level = computeLevel(state);

/* ---------- Router ---------- */

function routeFromHash() {
  const h = (location.hash || "#compare").replace("#", "");
  if (h.startsWith("pricing")) return "pricing";
  if (h.startsWith("dashboard")) return "dashboard";
  if (h.startsWith("waitlist")) return "waitlist";
  if (h.startsWith("account")) return "account";
  if (h.startsWith("reset")) return "reset"; // new reset route
  return "compare";
}

/* ---------- First-compare flag ---------- */

function getFirstCompareDone() {
  try {
    return localStorage.getItem(FIRST_KEY) === "1";
  } catch {
    return false;
  }
}

function markFirstCompareDone() {
  state.firstCompareDone = true;
  try {
    localStorage.setItem(FIRST_KEY, "1");
  } catch {
    // ignore
  }
}

/* ---------- Auth email memory helpers ---------- */

function loadLastAuthEmail() {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

function saveLastAuthEmail(email) {
  try {
    const clean = String(email || "").trim();
    if (!clean) localStorage.removeItem(LAST_EMAIL_KEY);
    else localStorage.setItem(LAST_EMAIL_KEY, clean);
  } catch {
    // ignore
  }
}

/* ---------- Gamification helpers (streak, lifetime, trial, insight) ---------- */

function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) {
      return { days: 0, best: 0, lastDate: "" };
    }
    const obj = JSON.parse(raw);
    return {
      days: Number(obj.days) || 0,
      best: Number(obj.best) || 0,
      lastDate: typeof obj.lastDate === "string" ? obj.lastDate : "",
    };
  } catch {
    return { days: 0, best: 0, lastDate: "" };
  }
}

function saveStreak(s) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function loadLifetimeCompares() {
  try {
    const raw = localStorage.getItem(LIFETIME_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function saveLifetimeCompares(n) {
  try {
    localStorage.setItem(LIFETIME_KEY, String(n));
  } catch {
    // ignore
  }
}

function loadTrialUntil() {
  try {
    const raw = localStorage.getItem(TRIAL_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function saveTrialUntil(ts) {
  try {
    if (!ts) {
      localStorage.removeItem(TRIAL_KEY);
      return;
    }
    localStorage.setItem(TRIAL_KEY, String(ts));
  } catch {
    // ignore
  }
}

function loadInsightRewarded() {
  try {
    return localStorage.getItem(INSIGHT_KEY) === "1";
  } catch {
    return false;
  }
}

function saveInsightRewarded(v) {
  try {
    if (!v) {
      localStorage.removeItem(INSIGHT_KEY);
    } else {
      localStorage.setItem(INSIGHT_KEY, "1");
    }
  } catch {
    // ignore
  }
}

function isTrialActive() {
  const now = Date.now();
  return !!state.trialUntil && state.trialUntil > now;
}

// Local date helper (YYYY-MM-DD in local time)
function localDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Level is a simple function of streak + lifetime compares
function computeLevel(s) {
  const days = s.streak?.days || 0;
  const lifetime = s.lifetimeCompares || 0;

  const fromDays = Math.min(5, Math.floor(days / 7) + 1);
  const fromLifetime = Math.min(5, Math.floor(lifetime / 25) + 1);
  const level = Math.max(fromDays, fromLifetime, 1);
  return level;
}

function incrementLifetime() {
  const next = (state.lifetimeCompares || 0) + 1;
  state.lifetimeCompares = next;
  saveLifetimeCompares(next);
  state.level = computeLevel(state);
}

// Called when a compare actually runs
function updateStreakOnCompare() {
  let s = state.streak || { days: 0, best: 0, lastDate: "" };
  const today = localDateString(0);

  if (s.lastDate === today) {
    return;
  }

  const yesterday = localDateString(-1);

  if (s.lastDate === yesterday) {
    s.days = (s.days || 0) + 1;
  } else {
    s.days = 1;
  }

  s.lastDate = today;
  s.best = Math.max(s.best || 0, s.days || 0);

  state.streak = s;
  saveStreak(s);

  if (s.days === 14 && !isTrialActive()) {
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const until = Date.now() + twoDaysMs;
    state.trialUntil = until;
    saveTrialUntil(until);
  }

  state.level = computeLevel(state);
}

/* ---------- Auth ---------- */

async function initAuth() {
  const { data } = await supabase.auth.getSession();
  state.user = data?.session?.user || null;

  supabase.auth.onAuthStateChange((_event, session) => {
    state.user = session?.user || null;
    render();
  });
}

/* ---------- Render ---------- */

function render() {
  state.route = routeFromHash();

  const prevUsed = state.usage?.used ?? 0;
  state.usage = getUsage();
  const newUsed = state.usage?.used ?? 0;
  state.usageBumped = newUsed > prevUsed;

  const root = document.querySelector("#app");
  root.innerHTML = App(state);

  wireGlobal();
  if (state.route === "compare") wireCompare();
  if (state.route === "dashboard") wireDashboard();
  if (state.route === "pricing") wirePricing();
  if (state.route === "waitlist") wireWaitlist();
  if (state.route === "account") wireAccount();
  if (state.route === "reset") wireReset();
}

/* ---------- Saved Views (localStorage for now) ---------- */

function loadSavedViews() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && x.id && typeof x.ts === "number")
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 12);
  } catch {
    return [];
  }
}

function persistSavedViews() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state.savedViews));
}

function saveCurrentView() {
  if (state.selected.length < 2) return;

  const v = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ts: Date.now(),
    mode: state.mode,
    items: [...state.selected],
    note: state.mode === "assets" ? "Sentiment + risk snapshot" : "Arbitrage scan snapshot",
    exchangeAsset: state.exchangeAsset || "BTC",
  };

  state.savedViews = [v, ...state.savedViews].slice(0, 12);
  persistSavedViews();
}

// Reopen saved view (works from compare or dashboard)
function applySavedView(viewId) {
  const v = state.savedViews.find((x) => x.id === viewId);
  if (!v) return;

  state.mode = v.mode;
  state.selected = [...(v.items || [])];
  state.exchangeAsset = v.exchangeAsset || "BTC";
  state.lastAction = "reopen";

  if (state.route === "compare") {
    render();
  } else {
    location.hash = "#compare";
  }
}

/* ---------- Auth Modal ---------- */

function openAuthModal() {
  const m = document.getElementById("authModal");
  if (!m) return;

  m.classList.add("show");

  // Always reset mode to login on open (your toggle can still switch it)
  setAuthMode("login");

  const emailInput = document.getElementById("authEmail");
  const passInput = document.getElementById("authPass");
  const status = document.getElementById("authStatus");

  if (status) status.textContent = "";

  // Prefer: logged-in email -> last typed email -> blank
  const last = loadLastAuthEmail();
  const preferred = (state.user?.email || last || "").trim();

  if (emailInput) {
    // Don't override if already typed (e.g. reopen without closing)
    if (!emailInput.value) emailInput.value = preferred;

    // Focus after paint so it cooperates with modal animations
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Tiny polish:
        // - If there's already an email, jump them straight to password.
        // - Otherwise focus + select email for fast typing.
        const hasEmail = !!emailInput.value.trim();

        if (!hasEmail) {
          emailInput.focus();
          emailInput.select();
        } else {
          passInput?.focus();
        }
      }, 60);
    });
  }

  if (passInput) passInput.value = "";
}

function closeAuthModal() {
  document.getElementById("authModal")?.classList.remove("show");
}

function setAuthMode(mode) {
  const title = document.getElementById("authTitle");
  const sub = document.getElementById("authSubtitle");
  const toggle = document.getElementById("toggleAuthModeBtn");
  const submit = document.getElementById("authSubmitBtn");
  const status = document.getElementById("authStatus");

  if (status) status.textContent = "";

  if (mode === "signup") {
    if (title) title.textContent = "Create account";
    if (sub) sub.textContent = "Email + password (MVP).";
    if (submit) submit.textContent = "Create account";
    if (toggle) {
      toggle.dataset.mode = "signup";
      toggle.textContent = "I already have an account";
    }
  } else {
    if (title) title.textContent = "Login";
    if (sub) sub.textContent = "Use email + password.";
    if (submit) submit.textContent = "Continue";
    if (toggle) {
      toggle.dataset.mode = "login";
      toggle.textContent = "Create an account instead";
    }
  }
}

async function submitAuth() {
  const email = (document.getElementById("authEmail")?.value || "").trim();
  const pass = (document.getElementById("authPass")?.value || "").trim();
  const toggle = document.getElementById("toggleAuthModeBtn");
  const mode = toggle?.dataset?.mode === "signup" ? "signup" : "login";
  const status = document.getElementById("authStatus");

  if (!email || !pass) {
    if (status) status.textContent = "Please enter email + password.";
    return;
  }

  // Persist last typed email (nice UX even if auth fails)
  saveLastAuthEmail(email);

  if (status) status.textContent = "Working…";

  try {
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;

      if (status) status.textContent = "Account created. You're in.";
      closeAuthModal();
      location.hash = "#dashboard";
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;

    if (status) status.textContent = "Logged in.";
    closeAuthModal();
    location.hash = "#dashboard";
  } catch (e) {
    if (status) status.textContent = e?.message || "Auth error.";
  }
}

async function logout() {
  closeAccountMenu();
  await supabase.auth.signOut();
  location.hash = "#compare";
}

/* ---------- Account Menu ---------- */

function openAccountMenu() {
  const btn = document.getElementById("accountBtn");
  const menu = document.getElementById("accountMenu");
  if (!btn || !menu) return;

  menu.classList.add("show");
  btn.setAttribute("aria-expanded", "true");
}

function closeAccountMenu() {
  const btn = document.getElementById("accountBtn");
  const menu = document.getElementById("accountMenu");
  if (!menu) return;

  menu.classList.remove("show");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  const menu = document.getElementById("accountMenu");
  if (!menu) return;
  if (menu.classList.contains("show")) closeAccountMenu();
  else openAccountMenu();
}

/* ---------- One-time global listeners ---------- */

let globalBound = false;

function bindGlobalOnce() {
  if (globalBound) return;
  globalBound = true;

  document.addEventListener("click", (e) => {
    const btn = document.getElementById("accountBtn");
    const menu = document.getElementById("accountMenu");
    if (!menu || !menu.classList.contains("show")) return;

    const t = e.target;
    if (btn && btn.contains(t)) return;
    if (menu && menu.contains(t)) return;

    closeAccountMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeAccountMenu();
    closeAuthModal();
    hideLimitModal();
    hideInsightsModal();
    hideExchangeModal();
    closeEmailInsightModal();
  });

  window.addEventListener("hashchange", render);
}

/* ---------- Global Wiring ---------- */

function wireGlobal() {
  bindGlobalOnce();

  const loginBtn = document.getElementById("loginBtn");
  const getStartedBtn = document.getElementById("getStartedBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) loginBtn.addEventListener("click", openAuthModal);
  if (getStartedBtn) getStartedBtn.addEventListener("click", openAuthModal);
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  document.getElementById("closeAuth")?.addEventListener("click", closeAuthModal);
  document.getElementById("authSubmitBtn")?.addEventListener("click", submitAuth);

  const toggleAuth = document.getElementById("toggleAuthModeBtn");
  if (toggleAuth) {
    toggleAuth.addEventListener("click", () => {
      const current = toggleAuth.dataset.mode === "signup" ? "signup" : "login";
      setAuthMode(current === "login" ? "signup" : "login");
    });
  }

  const authBackdrop = document.getElementById("authModal");
  if (authBackdrop) {
    authBackdrop.addEventListener("click", (e) => {
      if (e.target === authBackdrop) closeAuthModal();
    });
  }

  const authEmail = document.getElementById("authEmail");
  const authPass = document.getElementById("authPass");

  // Remember last typed email (input + blur)
  if (authEmail) {
    authEmail.addEventListener("input", (e) => saveLastAuthEmail(e.target.value));
    authEmail.addEventListener("blur", (e) => saveLastAuthEmail(e.target.value));
  }

  // Enter-to-submit
  [authEmail, authPass].forEach((el) => {
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitAuth();
    });
  });

  const accountBtn = document.getElementById("accountBtn");
  const accountMenu = document.getElementById("accountMenu");

  if (accountBtn && accountMenu) {
    accountBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleAccountMenu();
    });

    accountMenu.addEventListener("click", (e) => e.stopPropagation());

    document.getElementById("acctProfileBtn")?.addEventListener("click", () => {
      closeAccountMenu();
      location.hash = "#account";
    });

    document.getElementById("acctOffersBtn")?.addEventListener("click", () => {
      closeAccountMenu();
      location.hash = "#pricing";
    });

    document.getElementById("acctTrialBtn")?.addEventListener("click", () => {
      closeAccountMenu();
      location.hash = "#pricing";
    });
  }
}

/* ---------- Pricing + Waitlist ---------- */

function wirePricing() {
  const m = document.getElementById("checkoutMonthly");
  const y = document.getElementById("checkoutYearly");

  if (m) m.addEventListener("click", () => (location.hash = "#waitlist"));
  if (y) y.addEventListener("click", () => (location.hash = "#waitlist"));
}

async function wireWaitlist() {
  const btn = document.getElementById("joinWaitlistBtn");
  const emailEl = document.getElementById("waitlistEmail");
  const statusEl = document.getElementById("waitlistStatus");

  if (!btn || !emailEl) return;

  if (!emailEl.value && state.user?.email) emailEl.value = state.user.email;

  btn.addEventListener("click", async () => {
    const email = (emailEl.value || "").trim();
    if (!email) {
      if (statusEl) statusEl.textContent = "Enter your email.";
      return;
    }

    if (statusEl) statusEl.textContent = "Adding you…";

    try {
      const userId = state.user?.id || null;

      const { error } = await supabase.from("premium_waitlist").insert({
        email,
        user_id: userId,
      });

      if (error) throw error;

      if (statusEl) statusEl.textContent = "✅ Added. We'll email you when premium opens.";
    } catch (e) {
      const msg = e?.message || "";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        if (statusEl) statusEl.textContent = "✅ You're already on the list.";
        return;
      }
      if (statusEl) statusEl.textContent = msg || "Waitlist error.";
    }
  });
}

/* ---------- Dashboard Wiring ---------- */

function wireDashboard() {
  const clear = document.getElementById("clearSavedBtn");
  const premium = document.getElementById("goPremiumBtn");

  if (clear) {
    clear.addEventListener("click", () => {
      state.savedViews = [];
      persistSavedViews();
      render();
    });
  }

  if (premium) premium.addEventListener("click", () => (location.hash = "#pricing"));

  document.querySelectorAll("[data-viewid]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-viewid");
      applySavedView(id);
    });
  });
}

/* ---------- Account Wiring ---------- */

function wireAccount() {
  const changeBtn = document.getElementById("changePasswordBtn");
  const resetBtn = document.getElementById("sendResetLinkBtn");
  const newPassInput = document.getElementById("newPasswordInput");
  const statusEl = document.getElementById("accountStatus");
  const billingBtn = document.getElementById("billingManageBtn");

  if (billingBtn) {
    billingBtn.addEventListener("click", () => {
      location.hash = "#pricing";
    });
  }

  if (changeBtn && newPassInput) {
    changeBtn.addEventListener("click", async () => {
      const pwd = (newPassInput.value || "").trim();
      if (!pwd || pwd.length < 8) {
        if (statusEl) statusEl.textContent = "Use at least 8 characters for your new password.";
        return;
      }
      if (!state.user) {
        if (statusEl) statusEl.textContent = "You need to be logged in to change your password.";
        return;
      }
      if (statusEl) statusEl.textContent = "Updating password…";

      try {
        const { error } = await supabase.auth.updateUser({ password: pwd });
        if (error) throw error;
        newPassInput.value = "";
        if (statusEl) statusEl.textContent = "Password updated.";
      } catch (e) {
        if (statusEl) statusEl.textContent = e?.message || "Error updating password.";
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      if (!state.user?.email) {
        if (statusEl) statusEl.textContent = "Add an email first, then request a reset link.";
        return;
      }
      if (statusEl) statusEl.textContent = "Sending reset link…";

      try {
        const redirectTo = `${window.location.origin}/#reset`;
        const { error } = await supabase.auth.resetPasswordForEmail(state.user.email, {
          redirectTo,
        });
        if (error) throw error;
        if (statusEl) statusEl.textContent = "Check your inbox for a password reset link.";
      } catch (e) {
        if (statusEl) statusEl.textContent = e?.message || "Error sending reset link.";
      }
    });
  }
}

/* ---------- Reset Password Wiring (new) ---------- */

function wireReset() {
  const btn = document.getElementById("resetSubmitBtn");
  const p1El = document.getElementById("resetPass1");
  const p2El = document.getElementById("resetPass2");
  const statusEl = document.getElementById("resetStatus");

  if (!btn || !p1El || !p2El) return;

  async function handleReset() {
    const p1 = (p1El.value || "").trim();
    const p2 = (p2El.value || "").trim();

    if (!p1 || !p2) {
      if (statusEl) statusEl.textContent = "Enter and confirm your new password.";
      return;
    }
    if (p1.length < 8) {
      if (statusEl) statusEl.textContent = "Password must be at least 8 characters.";
      return;
    }
    if (p1 !== p2) {
      if (statusEl) statusEl.textContent = "Passwords do not match.";
      return;
    }

    if (statusEl) statusEl.textContent = "Setting your new password…";

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        if (statusEl)
          statusEl.textContent =
            "This reset link is invalid or expired. Request a new reset from the Account page.";
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) throw error;

      p1El.value = "";
      p2El.value = "";
      if (statusEl) statusEl.textContent = "Password updated. Redirecting you back in…";

      setTimeout(() => {
        location.hash = "#dashboard";
      }, 900);
    } catch (e) {
      if (statusEl)
        statusEl.textContent =
          e?.message ||
          "Something went wrong updating your password. Try requesting a new reset link.";
    }
  }

  btn.addEventListener("click", handleReset);

  [p1El, p2El].forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleReset();
    });
  });
}

/* ---------- Compare Wiring ---------- */

function wireCompare() {
  const modeAssets = document.getElementById("modeAssets");
  const modeExchanges = document.getElementById("modeExchanges");

  if (modeAssets)
    modeAssets.addEventListener("click", () => {
      state.mode = "assets";
      state.selected = [];
      state.lastAction = null;
      render();
    });

  if (modeExchanges)
    modeExchanges.addEventListener("click", () => {
      state.mode = "exchanges";
      state.selected = [];
      state.lastAction = null;
      render();
    });

  document.querySelectorAll("[data-chip]").forEach((el) => {
    el.addEventListener("click", () => {
      const c = el.getAttribute("data-chip");
      toggleSelected(c);
      paintSelected();
    });
  });

  const compareBtn = document.getElementById("compareBtn");
  const saveBtn = document.getElementById("saveBtn");

  if (compareBtn) compareBtn.addEventListener("click", onCompare);
  if (saveBtn)
    saveBtn.addEventListener("click", () => {
      const before = state.savedViews.length;
      saveCurrentView();
      if (state.savedViews.length > before) {
        paintSavedBlock();
        showSaveToast(state.savedViews.length);
      }
    });

  wireModals();
  wireFirstStrip();

  paintSelected();
  paintResultBody();
  paintSavedBlock();

  if (state.insightRewarded) {
    showInsightRewardBanner();
  }
}

/* First-time helper strip interactions */

function wireFirstStrip() {
  const strip = document.getElementById("firstStrip");
  if (!strip) return;

  const step1 = document.getElementById("firstStep1");
  const step2 = document.getElementById("firstStep2");
  const step3 = document.getElementById("firstStep3");

  const chips = document.getElementById("chips");
  const selectedRow = document.querySelector(".selectedRow");
  const compareBtn = document.getElementById("compareBtn");

  function pulse(el) {
    if (!el) return;
    el.classList.remove("firstPulse");
    void el.offsetWidth;
    el.classList.add("firstPulse");
    setTimeout(() => el.classList.remove("firstPulse"), 650);
  }

  if (step1) {
    step1.addEventListener("click", () => {
      if (chips) chips.scrollIntoView({ behavior: "smooth", block: "center" });
      pulse(chips);
    });
  }

  if (step2) {
    step2.addEventListener("click", () => {
      if (selectedRow) selectedRow.scrollIntoView({ behavior: "smooth", block: "center" });
      pulse(selectedRow);
    });
  }

  if (step3) {
    step3.addEventListener("click", () => {
      if (compareBtn) {
        compareBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        compareBtn.focus();
      }
      pulse(compareBtn);
    });
  }
}

/* ---------- Compare helpers ---------- */

function toggleSelected(item) {
  const ix = state.selected.indexOf(item);
  if (ix >= 0) state.selected.splice(ix, 1);
  else state.selected.push(item);
}

function paintSelected() {
  const holder = document.getElementById("selectedList");
  if (!holder) return;
  holder.innerHTML = "";

  state.selected.forEach((s) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.innerHTML = `<span>${s}</span><button class="pillX" aria-label="remove">✕</button>`;
    pill.querySelector("button").addEventListener("click", () => {
      toggleSelected(s);
      paintSelected();
    });
    holder.appendChild(pill);
  });
}

function onCompare() {
  if (state.selected.length < 2) {
    toastResult("Select at least 2 items to compare.", "warn");
    return;
  }

  const used = state.usage?.used ?? 0;
  const limit = state.usage?.freeLimit ?? 3;

  if (!canCompare()) {
    if (used >= limit) {
      showCapHitInline(limit);
    }
    showLimitModal();
    return;
  }

  incrementUsage();
  incrementLifetime();
  updateStreakOnCompare();

  const input = document.getElementById("search");
  if (state.mode === "exchanges") {
    const typed = (input?.value || "").trim().toUpperCase();
    state.exchangeAsset = typed || "BTC";
  }

  state.lastAction = "compare";

  if (!state.firstCompareDone) {
    markFirstCompareDone();
  }

  if (!state.insightRewarded && state.lifetimeCompares >= 10) {
    state.insightRewarded = true;
    saveInsightRewarded(true);
    handleInsightUnlock();
  }

  paintResultBody();
  render();
}

/* Reward unlock handling */

function handleInsightUnlock() {
  if (state.user?.email) {
    showInsightRewardBanner(
      `You unlocked a free insight. We'll email a preview to ${state.user.email}.`
    );
  } else {
    showInsightRewardBanner("You unlocked a free insight. Add your email to receive it.");
  }
  openEmailInsightModal();
}

function showInsightRewardBanner(customMessage) {
  const el = document.getElementById("rewardToast");
  if (!el) return;
  const msg =
    customMessage ||
    "You unlocked a free market insight. Preview it and choose where to send it.";

  el.innerHTML = `
    <span>${msg}</span>
    <button class="btnMiniGhost rewardPreviewBtn" id="previewInsightBtn">Preview email</button>
  `;
  el.classList.add("rewardToastShow");

  const btn = document.getElementById("previewInsightBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      openEmailInsightModal();
    });
  }
}

/* Email insight modal helpers */

function openEmailInsightModal() {
  document.getElementById("emailInsightModal")?.classList.add("show");
}

function closeEmailInsightModal() {
  document.getElementById("emailInsightModal")?.classList.remove("show");
}

function handleSendInsightEmail() {
  closeEmailInsightModal();
  if (state.user?.email) {
    showInsightRewardBanner(
      `Got it — your free insight will be sent to ${state.user.email} once email sending is live.`
    );
  } else {
    openAuthModal();
  }
}

/* Sample compare from empty Saved block */

function runSampleCompare() {
  state.route = "compare";
  state.mode = "assets";
  state.selected = ["BTC", "ETH", "SOL"];
  state.exchangeAsset = "BTC";

  paintSelected();
  onCompare();
}

/* Build contextual title for result strip */

function applyResultTitle() {
  const titleEl = document.querySelector(".resultTitle");
  const line = document.querySelector(".resultLine");
  if (!titleEl || !line) return;

  if (!state.selected.length) {
    line.classList.remove("warn");
    line.classList.add("ok");
    titleEl.textContent = "Select assets above and hit Compare to start.";
    state.lastAction = null;
    return;
  }

  let base = "";

  if (state.mode === "assets") {
    const shown = state.selected.slice(0, 4).join(", ");
    const extra = state.selected.length > 4 ? ` +${state.selected.length - 4}` : "";
    base = `Comparing: ${shown}${extra}`;
  } else {
    const asset = state.exchangeAsset || "BTC";
    base = `Exchanges for: ${asset}`;
  }

  const prefix = state.lastAction === "reopen" ? "Reopened • " : "";
  line.classList.remove("warn");
  line.classList.add("ok");
  titleEl.textContent = `${prefix}${base}`;

  if (state.lastAction === "reopen") state.lastAction = null;
}

function paintResultBody() {
  const body = document.getElementById("resultBody");
  if (!body) return;

  if (state.mode === "assets") {
    body.innerHTML = AssetsTable(state.selected);
    body.querySelectorAll("[data-assetrow]").forEach((row) => {
      row.addEventListener("click", () => {
        const sym = row.getAttribute("data-assetrow");
        openInsights(sym);
      });
    });
  } else {
    body.innerHTML = ExchangesTable(state.selected, state.exchangeAsset);
    body.querySelectorAll("[data-exinsight]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openExchangeInsight(btn.getAttribute("data-exinsight"));
      });
    });
  }

  applyResultTitle();
}

/* Saved views block */

function paintSavedBlock() {
  const el = document.getElementById("savedBlock");
  if (!el) return;

  if (!state.savedViews.length) {
    el.innerHTML = `
      <div class="noteBox">
        <div class="savedTitle">No saved views yet</div>
        <div class="muted small" style="margin-top:4px;">
          Run a compare, hit <b>Save View</b>, and your best setups will appear here and in your Dashboard.
        </div>
        <button class="btnMini" id="sampleViewBtn" style="margin-top:8px;">Run a sample compare</button>
      </div>
    `;

    const sampleBtn = document.getElementById("sampleViewBtn");
    if (sampleBtn) sampleBtn.addEventListener("click", runSampleCompare);
    return;
  }

  el.innerHTML = `
    <div class="savedHdr">
      <div id="savedHeaderInner">
        <div class="savedTitle">Saved views</div>
        <div class="muted small">Quick previews • click to reopen • manage in Dashboard</div>
        <div class="saveToast muted small" id="saveToast"></div>
      </div>
      <div class="savedBtns">
        <a class="btnMini" href="#dashboard">Open Dashboard</a>
        <button class="btnMiniGhost" id="clearSavedInline">Clear</button>
      </div>
    </div>

    <div class="savedGrid">
      ${state.savedViews.slice(0, 6).map((v) => SavedMiniCard(v)).join("")}
    </div>
  `;

  document.getElementById("clearSavedInline")?.addEventListener("click", () => {
    state.savedViews = [];
    persistSavedViews();
    paintSavedBlock();
  });

  el.querySelectorAll("[data-viewid]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-viewid");
      applySavedView(id);
    });
  });
}

function SavedMiniCard(v) {
  const when = new Date(v.ts).toLocaleString();
  const label = v.mode === "exchanges" ? "Exchange scan" : "Asset compare";
  const items = (v.items || []).slice(0, 3).join(", ");
  return `
    <button class="savedCard" data-viewid="${v.id}">
      <div class="savedCardTop">
        <div class="savedCardTitle">${label}</div>
        <div class="savedCardTime">${when}</div>
      </div>
      <div class="muted small">${items}</div>
      <div class="savedCardFoot">
        <span class="tag">Reopen</span>
        <span class="arrow">→</span>
      </div>
    </button>
  `;
}

/* Saved view toast */

function showSaveToast(count) {
  const toast = document.getElementById("saveToast");
  const header = document.getElementById("savedHeaderInner");
  if (!toast) return;

  const label = count === 1 ? "first saved view" : `view #${count}`;
  toast.textContent = `Saved ${label} to your Dashboard.`;

  toast.classList.remove("saveToastShow");
  void toast.offsetWidth;
  toast.classList.add("saveToastShow");

  if (header) {
    header.classList.remove("savePulse");
    void header.offsetWidth;
    header.classList.add("savePulse");
  }
}

/* Cap-hit inline */

function showCapHitInline(limit) {
  const pill = document.querySelector(".usagePill");
  const inline = document.getElementById("usageInline");

  if (inline) {
    inline.innerHTML = `
      <span class="muted small">You’ve used all <b>${limit}</b> free compares today.</span>
      <button class="btnMini" id="usageUpgradeBtn">See plans</button>
    `;
    const btn = document.getElementById("usageUpgradeBtn");
    if (btn) btn.addEventListener("click", () => (location.hash = "#pricing"));
  }

  if (pill) {
    pill.classList.remove("usageCapPulse");
    void pill.offsetWidth;
    pill.classList.add("usageCapPulse");
  }
}

/* ---------- Modals ---------- */

function wireModals() {
  document.getElementById("closeLimit")?.addEventListener("click", hideLimitModal);
  document
    .getElementById("goPricingFromLimit")
    ?.addEventListener("click", () => (location.hash = "#pricing"));
  document.getElementById("resetDemo")?.addEventListener("click", () => {
    resetDemoUsage();
    hideLimitModal();
    render();
  });

  document.getElementById("closeInsights")?.addEventListener("click", hideInsightsModal);
  document
    .getElementById("goPricingFromInsights")
    ?.addEventListener("click", () => (location.hash = "#pricing"));
  document.getElementById("createAlert")?.addEventListener("click", () => (location.hash = "#pricing"));

  document.getElementById("closeExchange")?.addEventListener("click", hideExchangeModal);
  document
    .getElementById("goPricingFromExchange")
    ?.addEventListener("click", () => (location.hash = "#pricing"));

  document.getElementById("closeEmailInsight")?.addEventListener("click", closeEmailInsightModal);
  document.getElementById("sendInsightEmail")?.addEventListener("click", handleSendInsightEmail);

  ["limitModal", "insightsModal", "exchangeModal", "emailInsightModal"].forEach((id) => {
    const b = document.getElementById(id);
    if (b) {
      b.addEventListener("click", (e) => {
        if (e.target === b) {
          if (id === "limitModal") hideLimitModal();
          if (id === "insightsModal") hideInsightsModal();
          if (id === "exchangeModal") hideExchangeModal();
          if (id === "emailInsightModal") closeEmailInsightModal();
        }
      });
    }
  });
}

function showLimitModal() {
  document.getElementById("limitModal")?.classList.add("show");
}
function hideLimitModal() {
  document.getElementById("limitModal")?.classList.remove("show");
}

/* ---------- Insights Modals ---------- */

function openInsights(sym) {
  const mood = pick(["Bullish", "Neutral", "Bearish"]);
  const pct = pick([16, 24, 29, 39, 51, 65, 69]);
  const risk = pick(["Low", "Medium", "High"]);
  const change = (Math.random() * 6 - 3).toFixed(2);

  document.getElementById("insTitle").textContent = `${sym} • Community Insights`;
  document.getElementById("insSubtitle").textContent = `Sentiment + risk snapshot`;

  const badges = document.getElementById("insBadges");
  badges.innerHTML = `
    <span class="badge">Sentiment: <b>${mood}</b> (${pct}%)</span>
    <span class="badge">Risk: <b>${risk}</b></span>
    <span class="badge">24h: <b>${change}%</b></span>
  `;

  const bullets = document.getElementById("insBullets");
  bullets.innerHTML = `
    <div class="bullet">• Crowd mood: <b>${mood}</b> (${pct}%) — volatility class: <b>${risk}</b>.</div>
    <div class="bullet">• If you're building a basket: check overlap risk (highly correlated majors move together).</div>
    <div class="bullet">• Premium unlocks: prediction shifts, saved dashboards, and alert triggers.</div>
  `;

  document.getElementById("insightsModal")?.classList.add("show");
}

function hideInsightsModal() {
  document.getElementById("insightsModal")?.classList.remove("show");
}

function openExchangeInsight(exchangeName) {
  document.getElementById("exTitle").textContent = `${exchangeName} • Insight (${state.exchangeAsset || "BTC"})`;
  document.getElementById("exchangeModal")?.classList.add("show");
}
function hideExchangeModal() {
  document.getElementById("exchangeModal")?.classList.remove("show");
}

/* ---------- Demo data builders ---------- */

function AssetsTable(selected) {
  const rows = selected
    .slice(0, 6)
    .map((sym) => {
      const price = (Math.random() * 200 + 0.05).toFixed(4);
      const ch = (Math.random() * 8 - 4).toFixed(2);
      const sentiment = pick(["Bullish", "Neutral", "Bearish"]);
      const pct = pick([3, 16, 24, 29, 39, 51, 65, 69]);
      const risk = pick(["Low", "Medium", "High"]);
      const mcap = `${(Math.random() * 90 + 10).toFixed(2)}B`;

      return `
      <tr class="row" data-assetrow="${sym}">
        <td class="assetCell">
          <div class="sym">${sym}</div>
          <div class="muted small">${tagline(sym)}</div>
        </td>
        <td class="num">$${price}</td>
        <td class="num ${Number(ch) >= 0 ? "pos" : "neg"}">${Number(ch) >= 0 ? "+" : ""}${ch}%</td>
        <td><span class="pillSent ${sentClass(sentiment)}">${sentiment} (${pct}%)</span></td>
        <td><span class="pillRisk ${riskClass(risk)}">${risk}</span></td>
        <td class="num">${premiumBlur()}</td>
        <td class="num">${mcap}</td>
      </tr>
    `;
    })
    .join("");

  return `
    <div class="tableWrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Price</th>
            <th>24h Change</th>
            <th>Community Sentiment</th>
            <th>Risk</th>
            <th>Community Prediction (24h)</th>
            <th>Market Cap</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function ExchangesTable(exchanges, asset) {
  const picked = exchanges.slice(0, 6);
  const rows = picked
    .map((ex, idx) => {
      const base = 83000 + Math.random() * 900;
      const price = (base + idx * 7).toFixed(0);
      const vol = `$${(Math.random() * 2 + 0.7).toFixed(2)}B`;
      const rating = (4.2 + Math.random() * 0.6).toFixed(1);
      const fees = `0.08% – 0.18%`;
      const signal = idx === 0 ? "Best Buy" : idx === 1 ? "Best Sell" : "—";

      return `
      <tr class="row">
        <td class="assetCell">
          <div class="sym">${ex}</div>
          <div class="muted small">${asset}/USDT</div>
        </td>
        <td class="num"><b>$${price}</b></td>
        <td class="num">${vol}</td>
        <td><span class="ratingPill">★ ${rating}</span> <span class="muted small">(${asset} traders)</span></td>
        <td class="muted">${fees}</td>
        <td><span class="sig ${idx === 0 ? "good" : idx === 1 ? "bad" : "mid"}">${signal}</span></td>
        <td>
          <button class="btnMiniGhost" data-exinsight="${ex}">Insight</button>
        </td>
      </tr>
    `;
    })
    .join("");

  const bestBuy = picked[0] || "Binance";
  const bestSell = picked[1] || "Bybit";
  const spread = (Math.random() * 0.12).toFixed(2);

  return `
    <div class="resultGrid">
      <div class="tile">
        <div class="k">Best Buy</div>
        <div class="v">${bestBuy} • $${(83650 + Math.random() * 80).toFixed(0)}</div>
      </div>
      <div class="tile">
        <div class="k">Best Sell</div>
        <div class="v">${bestSell} • $${(83650 + Math.random() * 80).toFixed(0)}</div>
      </div>
      <div class="tile">
        <div class="k">Gross Spread</div>
        <div class="v">${spread}% <span class="muted small">• before fees/slippage</span></div>
      </div>
      <div class="tile">
        <div class="k">Arb Alerts</div>
        <div class="v">Set a threshold</div>
        <button class="btnMini" style="margin-top:10px" onclick="location.hash='#pricing'">Create alert</button>
      </div>
    </div>

    <div class="tableWrap" style="margin-top:12px;">
      <table class="tbl">
        <thead>
          <tr>
            <th>Exchange</th>
            <th>Price (USD)</th>
            <th>24h Vol</th>
            <th>Community Sentiment</th>
            <th>Fees</th>
            <th>Signal</th>
            <th>Insight</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ---------- Low-level helpers ---------- */

function toastResult(msg, kind) {
  const el = document.querySelector(".resultLine");
  if (!el) return;
  el.classList.remove("ok", "warn");
  el.classList.add(kind === "warn" ? "warn" : "ok");
  const title = el.querySelector(".resultTitle");
  if (title) title.innerHTML = `⚠️ ${msg}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function tagline(sym) {
  const map = {
    BTC: "Digital gold",
    ETH: "Smart contract platform",
    SOL: "High TPS",
    ADA: "Research-driven L1",
    DOGE: "Meme",
    DOT: "Interoperability",
  };
  return map[sym] || "Crypto asset";
}
function sentClass(s) {
  if (s === "Bullish") return "bull";
  if (s === "Bearish") return "bear";
  return "neu";
}
function riskClass(r) {
  if (r === "High") return "rHigh";
  if (r === "Medium") return "rMed";
  return "rLow";
}
function premiumBlur() {
  return `<span class="premiumBlur"><span class="premiumTag">Premium</span></span>`;
}

/* ---------- Boot ---------- */

initAuth().then(() => {
  render();
});
