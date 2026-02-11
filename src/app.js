// app.js renders based on route + state passed in from main.js

export function App(state) {
  const route = state.route || "compare";
  let page = "";

  if (route === "pricing") page = PricingPage(state);
  else if (route === "dashboard") page = DashboardPage(state);
  else if (route === "waitlist") page = WaitlistPage(state);
  else if (route === "account") page = AccountPage(state);
  else if (route === "reset") page = ResetPasswordPage(state);
  else page = ComparePage(state);

  return `${page}${Footer()}${AuthModal(state)}`;
}

/* ---------- Top Nav ---------- */

function TopNav(state) {
  const is = (r) => (state.route === r ? "active" : "");

  const authed = !!state.user;
  const userEmail = authed ? (state.user.email || "Signed in") : "";

  const trialActive = state.trialUntil && state.trialUntil > Date.now();
  const trialDaysLeft = trialActive
    ? Math.max(1, Math.ceil((state.trialUntil - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const trialPill = trialActive
    ? `<span class="trialNavPill">Trial: ${trialDaysLeft} day${trialDaysLeft > 1 ? "s" : ""} left</span>`
    : "";

  const points = (state.lifetimeCompares || 0) * 10;

  return `
      <div class="nav">
        <div class="brand">
          <div class="logo">◈</div>
          <div>
            <div class="brandName">CompareCrypto.ai</div>
            <div class="brandTag">AI-powered crypto intelligence</div>
          </div>
        </div>

        <div class="links">
          <a class="${is("compare")}" href="#compare">Compare</a>
          <a class="${is("dashboard")}" href="#dashboard">Dashboard</a>
          <a class="${is("pricing")}" href="#pricing">Pricing</a>
        </div>

        <div class="navRight">
          ${trialPill}
          ${
            authed
              ? `
                <button class="accountBtn" id="accountBtn" aria-haspopup="menu" aria-expanded="false">
                  <div class="accountBtnInner">
                    <span class="accountEmail">${escapeHtml(userEmail)}</span>
                    <span class="accountPoints">${points} points</span>
                  </div>
                  <span class="accountDots" aria-hidden="true">⋯</span>
                </button>

                <div class="accountMenu" id="accountMenu" role="menu" aria-label="Account menu">
                  <div class="accountMenuTop">
                    <div class="accountMenuLabel">Signed in as</div>
                    <div class="accountMenuEmail">${escapeHtml(userEmail)}</div>
                  </div>

                  <div class="accountMenuItems">
                    <button class="accountItem" id="acctProfileBtn" role="menuitem">
                      <span>Account / Profile</span>
                      <span class="muted small">›</span>
                    </button>

                    <button class="accountItem highlight" id="acctTrialBtn" role="menuitem">
                      <div>
                        <div class="accountItemTitle">3-day free trial</div>
                        <div class="muted small">Limited offer for active users</div>
                      </div>
                      <span class="pillLite">New</span>
                    </button>

                    <button class="accountItem" id="acctOffersBtn" role="menuitem">
                      <span>Offers</span>
                      <span class="muted small">›</span>
                    </button>

                    <div class="accountDivider"></div>

                    <button class="accountItem danger" id="logoutBtn" role="menuitem">
                      Logout
                    </button>
                  </div>
                </div>
              `
              : `
                <button class="ghost" id="loginBtn">Login</button>
                <button class="cta" id="getStartedBtn">Get Started</button>
              `
          }
        </div>
      </div>
    `;
}

/* ---------- Compare page ---------- */

function ComparePage(state) {
  const mode = state.mode || "assets";
  const usage = state.usage || { used: 0, freeLimit: 3 };
  const used = usage.used ?? 0;
  const limit = usage.freeLimit ?? 3;
  const bumped = !!state.usageBumped;

  const modeLabel =
    mode === "assets"
      ? "Assets • compare coins side-by-side"
      : "Exchanges • scan where to trade this asset";

  const modeRow = `
      <div class="modeRow">
        <div>
          <div class="segmented">
            <button class="seg ${mode === "assets" ? "active" : ""}" id="modeAssets">Assets</button>
            <button class="seg ${mode === "exchanges" ? "active" : ""}" id="modeExchanges">Exchanges</button>
          </div>
          <div class="muted small" style="margin-top:4px;">${modeLabel}</div>
        </div>
        <div class="usageLine">
          <div class="usagePill ${bumped ? "usagePulse" : ""}">
            <span class="muted">Daily Free Comparisons</span>
            <span class="usageCount"><b>${used}</b>/<b>${limit}</b></span>
          </div>
        </div>
        <div class="usageInline" id="usageInline"></div>
      </div>
    `;

  const chips =
    mode === "assets"
      ? ["BTC", "ETH", "SOL", "ADA", "DOGE", "DOT"]
      : ["Coinbase", "Kraken", "Binance", "Bybit", "OKX", "Bitstamp", "KuCoin"];

  const placeholder =
    mode === "assets"
      ? "Search (e.g. BTC, ETH, Solana)…"
      : "Type an asset to price across exchanges (e.g. BTC)…";

  const sponsorPill = `
      <div class="sponsorPill" title="Affiliate partner">
        <span class="muted">Market intel powered by</span>
        <span class="dotSep">•</span>
        <a class="logoPill" href="https://www.binance.com" target="_blank" rel="noreferrer">BINANCE</a>
      </div>
    `;

  const firstStrip =
    state.firstCompareDone
      ? ""
      : `
        <div class="firstStrip" id="firstStrip">
          <div class="firstStripLabel">Getting started</div>
          <div class="firstSteps">
            <button class="firstStep" id="firstStep1">
              <span class="firstNum">1</span>
              <span>Click a coin chip</span>
            </button>
            <button class="firstStep" id="firstStep2">
              <span class="firstNum">2</span>
              <span>Add 2+ items</span>
            </button>
            <button class="firstStep" id="firstStep3">
              <span class="firstNum">3</span>
              <span>Press Compare</span>
            </button>
          </div>
        </div>
      `;

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="hero">
            <h1 class="headline">Compare <span class="grad">ANYTHING Crypto</span>. Free.</h1>
            <p class="sub">Spot mispriced coins and exchanges using community sentiment, spreads, and prediction overlays — free in minutes, deeper signals when you upgrade.</p>
            ${modeRow}
          </div>

          <div class="compareCard">
            <div class="hint">Each click on <b>Compare</b> counts as 1 comparison. You get <b>${limit}</b> free per day.</div>

            <div class="rewardToast" id="rewardToast"></div>

            ${firstStrip}

            <div class="searchRow">
              <input class="input" id="search" placeholder="${placeholder}" />
              <button class="btn" id="compareBtn">Compare</button>
              <button class="btnAlt" id="saveBtn">Save View</button>
            </div>

            <div class="chips" id="chips">
              ${chips.map((c) => `<button class="chip" data-chip="${c}">+ ${c}</button>`).join("")}
            </div>

            <div class="selectedRow">
              <div class="muted">Selected:</div>
              <div class="selectedList" id="selectedList"></div>
            </div>

            <div class="results" id="results">
              <div class="resultLine ok">
                <div class="resultTop">
                  <div class="resultTitle"></div>
                  ${sponsorPill}
                </div>
              </div>

              <div id="resultBody"></div>
            </div>

            <div class="savedBlock" id="savedBlock"></div>
          </div>
        </div>

        ${LimitModal()}
        ${InsightsModal()}
        ${ExchangeInsightModal()}
        ${EmailInsightModal()}
      </div>
    `;
}

/* ---------- Dashboard page ---------- */

function DashboardPage(state) {
  const views = state.savedViews || [];
  const usage = state.usage || { used: 0, freeLimit: 3 };
  const used = usage.used ?? 0;
  const limit = usage.freeLimit ?? 3;
  const count = views.length;

  const streak = state.streak || { days: 0, best: 0 };
  const points = (state.lifetimeCompares || 0) * 10;
  const trialActive = state.trialUntil && state.trialUntil > Date.now();
  const trialDaysLeft = trialActive
    ? Math.max(1, Math.ceil((state.trialUntil - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const trialNote = trialActive
    ? `Trial: ${trialDaysLeft} day${trialDaysLeft > 1 ? "s" : ""} left`
    : "Use your compares to unlock rewards.";

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="pageHdr">
            <div>
              <div class="kicker">Dashboard</div>
              <div class="muted">Saved compares and scans you can reopen in one click when the market moves.</div>
            </div>
            <div class="pageActions">
              <button class="btnAlt" id="clearSavedBtn">Clear saved views</button>
              <button class="btn" id="goPremiumBtn">Unlock Premium Edge</button>
            </div>
          </div>

          <div class="dashMeta">
            <div class="dashStat">
              <div class="dashStatLabel">Saved views</div>
              <div class="dashStatValue">${count}</div>
            </div>
            <div class="dashStat">
              <div class="dashStatLabel">Today’s free compares</div>
              <div class="dashStatValue">${used}/${limit}</div>
            </div>
            <div class="dashStat">
              <div class="dashStatLabel">Total compares</div>
              <div class="dashStatValue">${state.lifetimeCompares || 0}</div>
              <div class="dashStatNote">${points} points earned</div>
            </div>
            <div class="dashStat">
              <div class="dashStatLabel">Usage streak</div>
              <div class="dashStatValue">${streak.days || 0} days</div>
              <div class="dashStatNote">Best: ${streak.best || 0} days in a row</div>
            </div>
            <div class="dashStat">
              <div class="dashStatLabel">Premium edge</div>
              <div class="dashStatNote">${trialNote}</div>
            </div>
          </div>

          <div class="dashGrid">
            ${views.length ? views.map(ViewCard).join("") : EmptyDash()}
          </div>

          <div class="dashTease">
            <div class="dashTeaseTitle">What you unlock with Premium</div>
            <div class="dashTeaseGrid">
              ${TeaseTile("Saved dashboards", "Pin your best setups as live dashboards you can reopen in one click.", "📊")}
              ${TeaseTile("Arbitrage alerts", "Get a heads up when spreads spike on your favorite exchanges.", "⚡")}
              ${TeaseTile("Community Prediction", "Direction + confidence overlays from active traders.", "🧠")}
              ${TeaseTile("AI Trading Bot (beta)", "Yearly plan unlocks experimental automated strategies.", "🤖")}
            </div>
          </div>
        </div>
      </div>
    `;
}

/* ---------- Account page ---------- */

function AccountPage(state) {
  const email = state.user?.email || "";
  const points = (state.lifetimeCompares || 0) * 10;

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="pageHdr">
            <div>
              <div class="kicker">Account & Security</div>
              <div class="muted">Manage your login, password, and upcoming billing in one place.</div>
            </div>
          </div>

          <div class="grid2" style="margin-top:14px;">
            <div class="plan">
              <div class="planTitle">Profile</div>
              <div class="muted small" style="margin-top:4px;">Email used to sign in</div>
              <div style="margin-top:6px; font-weight:800;">${escapeHtml(email)}</div>

              <div class="noteBox" style="margin-top:14px;">
                <div class="muted small">Points</div>
                <div style="margin-top:4px; font-weight:800;">${points} points</div>
                <div class="muted small" style="margin-top:4px;">Earned from total comparisons you’ve run.</div>
              </div>
            </div>

            <div class="plan">
              <div class="planTitle">Password & security</div>
              <div class="insList" style="padding:8px 0 0;">
                <div class="bullet">
                  <div class="muted small">Change password (while logged in)</div>
                  <input class="input" id="newPasswordInput" type="password" placeholder="New password (min 8 chars)" style="margin-top:6px;" />
                  <button class="btnMini" id="changePasswordBtn" style="margin-top:8px;">Update password</button>
                </div>

                <div class="bullet" style="margin-top:8px;">
                  <div class="muted small">Forgot your password?</div>
                  <div class="muted small" style="margin-top:4px;">We can email a reset link to ${escapeHtml(email) || "your account email"}.</div>
                  <button class="btnMiniGhost" id="sendResetLinkBtn" style="margin-top:8px;">Email me a reset link</button>
                </div>

                <div class="muted small" id="accountStatus" style="margin-top:10px;"></div>
              </div>
            </div>
          </div>

          <div class="grid2" style="margin-top:14px;">
            <div class="plan">
              <div class="planTitle">Billing</div>
              <div class="muted small" style="margin-top:4px;">You’re currently on the Free plan.</div>
              <ul>
                <li>Premium checkout is opening soon.</li>
                <li>When live, you’ll see your invoices and manage billing here.</li>
              </ul>
              <button class="btnFull" id="billingManageBtn">See Premium options</button>
            </div>

            <div class="plan">
              <div class="planTitle">Data & risk</div>
              <ul>
                <li>We only store your email + hashed password for auth.</li>
                <li>Usage metrics (compares, saves) are anonymous aggregates.</li>
                <li>No trading or exchange API keys are stored at this stage.</li>
              </ul>
              <div class="muted small">Crypto is risky; use this as decision support, not advice.</div>
            </div>
          </div>
        </div>
      </div>
    `;
}

/* ---------- Reset Password page ---------- */

function ResetPasswordPage(state) {
  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="pageHdr">
            <div>
              <div class="kicker">Reset your password</div>
              <div class="muted">Choose a new password to get back into your compares.</div>
            </div>
          </div>

          <div class="compareCard" style="margin-top:16px;">
            <div class="hint">
              This link only works once and expires shortly for security. If it fails, request a new reset from the Account page.
            </div>

            <div class="insList" style="padding:10px 4px 4px;">
              <div class="bullet">
                <div class="muted small">New password</div>
                <input class="input" id="resetPass1" type="password" placeholder="New password (min 8 chars)" style="margin-top:6px;" />
              </div>

              <div class="bullet" style="margin-top:8px;">
                <div class="muted small">Confirm password</div>
                <input class="input" id="resetPass2" type="password" placeholder="Repeat new password" style="margin-top:6px;" />
              </div>

              <div class="muted small" id="resetStatus" style="margin-top:10px;"></div>
            </div>

            <div class="modalCtas" style="padding:10px 4px 0;">
              <button class="ctaWide" id="resetSubmitBtn">Set new password</button>
            </div>
          </div>
        </div>
      </div>
    `;
}

/* ---------- Pricing page ---------- */

function PricingPage(state) {
  const trialActive = state.trialUntil && state.trialUntil > Date.now();
  const trialDaysLeft = trialActive
    ? Math.max(1, Math.ceil((state.trialUntil - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const trialBanner = trialActive
    ? `<div class="trialBanner">You’re on a 2-day Premium trial. Enjoy unlimited compares and signals for the next ${trialDaysLeft} day${
        trialDaysLeft > 1 ? "s" : ""
      }.</div>`
    : "";

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="pricingHero">
            <div class="kicker jumbo">Unlock Premium Edge</div>
            <div class="muted">Turn quick compares into an unfair advantage: live conviction tracking, shift alerts, deeper exchange intel, and AI overlays.</div>
            ${trialBanner}
          </div>

          <div class="grid2">
            <div class="plan">
              <div class="planTitle">Monthly</div>
              <div class="price">$20<span>/month</span></div>
              <ul>
                <li>Unlimited comparisons</li>
                <li>Saved views + dashboards</li>
                <li>Arbitrage alerts</li>
                <li>Community prediction overlays</li>
              </ul>
              <button class="btnFull" id="checkoutMonthly">Continue to Checkout</button>
            </div>

            <div class="plan glow">
              <div class="save">SAVE $40</div>
              <div class="planTitle">Yearly</div>
              <div class="price">$200<span>/year</span></div>
              <div class="muted small">($16.67/month)</div>
              <ul>
                <li>Everything in Monthly</li>
                <li>Priority feature access</li>
                <li><b>AI Trading Bot access (beta)</b></li>
                <li>Partner offers + fee discounts</li>
              </ul>
              <button class="btnFull" id="checkoutYearly">Continue to Checkout</button>
            </div>
          </div>

          <div class="noteBox">
            <div class="muted">
              Checkout is coming next. For now these buttons route to a waitlist so the product is usable today.
            </div>
          </div>
        </div>
      </div>
    `;
}

/* ---------- Waitlist page ---------- */

function WaitlistPage(state) {
  const prefill = state.user?.email || "";
  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="pricingHero">
            <div class="kicker jumbo">Premium is opening soon</div>
            <div class="muted">Drop your email — we'll notify you when checkout goes live.</div>
          </div>

          <div class="compareCard">
            <div class="hint">You can still use the free version right now.</div>

            <div class="searchRow">
              <input class="input" id="waitlistEmail" placeholder="you@domain.com" value="${escapeHtml(prefill)}" />
              <button class="btn" id="joinWaitlistBtn">Join waitlist</button>
            </div>

            <div class="muted small" id="waitlistStatus" style="margin-top:12px;"></div>

            <div class="noteBox" style="margin-top:14px;">
              <div class="muted">
                Premium includes unlimited compares, saved dashboards, and deeper exchange insights.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
}

/* ---------- Modals ---------- */

function LimitModal() {
  return `
      <div class="modalBackdrop" id="limitModal">
        <div class="modal">
          <div class="modalTop">
            <div>
              <div class="modalTitle">Want more comparisons?</div>
              <div class="muted">Unlock unlimited scans, saved dashboards, and premium signals.</div>
            </div>
            <button class="x" id="closeLimit">✕</button>
          </div>

          <div class="perkRow">
            <div class="perk">Unlimited compares</div>
            <div class="perk">Arbitrage alerts</div>
            <div class="perk">Saved views + dashboards</div>
            <div class="perk">Watchlists</div>
          </div>

          <div class="modalCtas">
            <button class="ctaWide" id="goPricingFromLimit">Unlock Premium Edge</button>
            <button class="ghostWide" id="resetDemo">Reset demo usage</button>
          </div>

          <div class="finePrint">Insights are community-based and for decision support — not financial advice.</div>
        </div>
      </div>
    `;
}

function InsightsModal() {
  return `
      <div class="modalBackdrop" id="insightsModal">
        <div class="modal big">
          <div class="modalTop">
            <div>
              <div class="modalTitle" id="insTitle">Community Insight</div>
              <div class="muted" id="insSubtitle">Live crowd conviction + momentum snapshot</div>
            </div>
            <button class="x" id="closeInsights">✕</button>
          </div>

          <div class="insBadges" id="insBadges"></div>
          <div class="insList" id="insBullets"></div>

          <div class="noteBox" style="margin:10px 6px 0;">
            <div class="muted small" style="line-height:1.35;">
              <b>Premium edge:</b> Get early shift alerts when the crowd flips, track conviction over time, and unlock AI “what’s next” overlays.
            </div>
          </div>

          <div class="modalCtas">
            <button class="ghostWide" id="createAlert">Set an alert</button>
            <button class="ctaWide" id="goPricingFromInsights">Unlock Premium Edge</button>
          </div>

          <div class="finePrint">Community-based decision support — not financial advice.</div>
        </div>
      </div>
    `;
}

function ExchangeInsightModal() {
  return `
      <div class="modalBackdrop" id="exchangeModal">
        <div class="modal big">
          <div class="modalTop">
            <div>
              <div class="modalTitle" id="exTitle">Exchange Insight</div>
              <div class="muted">Compare exchanges like a pro — perks, pitfalls, and what traders actually care about.</div>
            </div>
            <button class="x" id="closeExchange">✕</button>
          </div>

          <div class="exImpact">
            <div class="impactCard good">
              <div class="impactHdr">Why traders pick it</div>
              <ul>
                <li>Liquidity + execution quality on majors</li>
                <li>Feature depth (spot, perps, earn, etc.)</li>
                <li>Tools that suit active trading</li>
              </ul>
            </div>

            <div class="impactCard watch">
              <div class="impactHdr">Watch-outs</div>
              <ul>
                <li>Region availability + restrictions</li>
                <li>Fee tiers vary by volume</li>
                <li>UI/UX preference matters more than people admit</li>
              </ul>
            </div>
          </div>

          <div class="partnerStrip">
            <div class="muted">Premium perks</div>
            <div class="partnerPills">
              <span class="pillLite">Fee discounts</span>
              <span class="pillLite">Signup bonuses</span>
              <span class="pillLite">Region notes</span>
              <span class="pillLite">Alert triggers</span>
            </div>
          </div>

          <div class="modalCtas">
            <button class="ctaWide" id="goPricingFromExchange">Unlock Premium Perks</button>
          </div>

          <div class="finePrint">Partner links will appear here once the affiliate stack is connected.</div>
        </div>
      </div>
    `;
}

function EmailInsightModal() {
  return `
      <div class="modalBackdrop" id="emailInsightModal">
        <div class="modal big">
          <div class="modalTop">
            <div>
              <div class="modalTitle">Preview: Free Market Insight Email</div>
              <div class="muted">See the kind of insight we’ll send once email is wired up.</div>
            </div>
            <button class="x" id="closeEmailInsight">✕</button>
          </div>

          <div class="insList">
            <div class="bullet">
              <div class="muted small">Subject</div>
              <div><b>[CompareCrypto.ai]</b> Today’s most mispriced setup</div>
            </div>

            <div class="bullet" style="margin-top:8px;">
              <div class="muted small">Preview</div>
              <div class="muted small" style="margin-top:4px;">
                • Top spread opportunity across your tracked exchanges (with size + direction).<br/>
                • One sentiment-driven coin setup you should take a second look at.<br/>
                • Quick CTA to reopen this dashboard so you can act in under 30 seconds.
              </div>
            </div>

            <div class="bullet" style="margin-top:8px;">
              <div class="muted small">What happens next?</div>
              <div class="muted small" style="margin-top:4px;">
                Connect an email, and we’ll route this style of insight once per day you’re active — no spam, just high-signal recaps.
              </div>
            </div>
          </div>

          <div class="modalCtas">
            <button class="ctaWide" id="sendInsightEmail">Send this to my email</button>
          </div>

          <div class="finePrint">Preview only for now — we’ll plug in real signals + sending once the email pipeline is live.</div>
        </div>
      </div>
    `;
}

/* ---------- Auth modal (REVISED to be more visual, less text-heavy) ---------- */

function AuthModal(state) {
  const compares = state?.lifetimeCompares || 0;
  const points = compares * 10;
  const streakDays = state?.streak?.days || 0;

  const nextRewardAt = 10;
  const untilReward = Math.max(0, nextRewardAt - compares);
  const pct = Math.max(0, Math.min(100, Math.round((compares / nextRewardAt) * 100)));

  const progressCopy =
    compares >= nextRewardAt
      ? "Free insight unlocked — log in to claim it."
      : `Get a free insight in ${untilReward} compare${untilReward === 1 ? "" : "s"}.`;

  return `
      <div class="modalBackdrop" id="authModal">
        <div class="modal big">

          <div class="modalTop">
            <div>
              <div class="modalTitle" id="authTitle">Unlock your edge</div>
              <div class="muted" id="authSubtitle">${progressCopy}</div>
            </div>
            <button class="x" id="closeAuth">✕</button>
          </div>

          <!-- Two-column layout without new CSS classes -->
          <div style="
            display:grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 12px;
            padding: 10px 4px 0;
          ">

            <!-- LEFT: rewards/value (more visual) -->
            <div>

              <!-- Progress bar card -->
              <div class="bullet" style="margin-top:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                  <div>
                    <div class="muted small">Reward progress</div>
                    <div style="font-weight:900; margin-top:2px;">Free Insight Unlock</div>
                  </div>
                  <div style="font-weight:900;">${pct}%</div>
                </div>

                <div style="
                  margin-top:10px;
                  height:10px;
                  border-radius:999px;
                  border:1px solid rgba(148,163,184,.55);
                  background: rgba(9,13,32,.96);
                  overflow:hidden;
                ">
                  <div style="
                    height:100%;
                    width:${pct}%;
                    background: linear-gradient(90deg, rgba(0,212,255,.85), rgba(168,85,255,.70));
                  "></div>
                </div>

                <div class="muted small" style="margin-top:8px;">
                  ${compares >= nextRewardAt ? "Unlocked — log in and we’ll show your preview." : `Run ${untilReward} more compare${untilReward === 1 ? "" : "s"} to unlock.`}
                </div>
              </div>

              <!-- Stats pills -->
              <div class="perkRow" style="padding:10px 0 0;">
                <div class="perk">Points: <b style="margin-left:6px;">${points}</b></div>
                <div class="perk">Streak: <b style="margin-left:6px;">${streakDays}d</b></div>
                <div class="perk">Total compares: <b style="margin-left:6px;">${compares}</b></div>
              </div>

              <!-- Value tiles -->
              <div style="margin-top:8px;">
                <div class="bullet" style="margin-top:8px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-size:18px;">💾</div>
                    <div>
                      <div style="font-weight:900;">Save dashboards</div>
                      <div class="muted small" style="margin-top:2px;">Reopen your best setups in one click.</div>
                    </div>
                  </div>
                </div>

                <div class="bullet" style="margin-top:8px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-size:18px;">⚡</div>
                    <div>
                      <div style="font-weight:900;">Earn rewards</div>
                      <div class="muted small" style="margin-top:2px;">Streaks unlock trials + insight previews.</div>
                    </div>
                  </div>
                </div>

                <div class="bullet" style="margin-top:8px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-size:18px;">🧠</div>
                    <div>
                      <div style="font-weight:900;">Premium signals later</div>
                      <div class="muted small" style="margin-top:2px;">Alerts, prediction overlays, exchange intel.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="finePrint" style="padding-left:0; padding-right:0;">
                Traders use CompareCrypto.ai to scan spreads + sentiment fast — then save the winners.
              </div>
            </div>

            <!-- RIGHT: form -->
            <div>
              <div class="insList" style="padding:0;">
                <div class="bullet" style="margin-top:0;">
                  <div class="muted small">Email</div>
                  <input class="input" id="authEmail" placeholder="you@domain.com" />
                </div>

                <div class="bullet" style="margin-top:10px;">
                  <div class="muted small">Password</div>
                  <input class="input" id="authPass" type="password" placeholder="••••••••" />
                </div>

                <div class="muted small" id="authStatus" style="margin-top:12px;"></div>

                <div class="modalCtas" style="margin-top:14px;">
                  <button class="ctaWide" id="authSubmitBtn">Continue</button>
                  <button class="ghostWide" id="toggleAuthModeBtn" data-mode="login">New here? Create a free account</button>
                </div>

                <div class="finePrint">
                  No spam. Just account + product updates. You can delete your account any time.
                </div>
              </div>
            </div>

          </div>

          <!-- Simple mobile stacking -->
          <div style="display:none;" aria-hidden="true"></div>
        </div>
      </div>
    `;
}

/* ---------- Footer ---------- */

function Footer() {
  return `
      <div class="footerShell">
        <footer class="siteFooter">
          <span class="footerLabel">Risk notice</span>
          <span class="footerText">
            Crypto assets are highly volatile. Nothing on CompareCrypto.ai is investment advice. Do your own research.
          </span>
        </footer>
      </div>
    `;
}

/* ---------- Helpers (cards, tiles, escape) ---------- */

function ViewCard(v) {
  const when = new Date(v.ts).toLocaleString();
  const chips = (v.items || [])
    .slice(0, 4)
    .map((x) => `<span class="miniChip">${escapeHtml(x)}</span>`)
    .join("");
  const label = v.mode === "exchanges" ? "Exchange scan" : "Asset compare";
  return `
      <button class="viewCard" data-viewid="${v.id}">
        <div class="viewTop">
          <div class="viewTitle">${label}</div>
          <div class="viewTime">${when}</div>
        </div>
        <div class="viewMeta">
          <div class="muted small">${v.mode === "exchanges" ? "Exchanges" : "Assets"}:</div>
          <div class="miniChips">${chips}</div>
        </div>
        <div class="viewFooter">
          <div class="muted small">${escapeHtml(v.note || "Saved view")}</div>
          <div class="reopen">Reopen →</div>
        </div>
      </button>
    `;
}

function EmptyDash() {
  return `
      <div class="emptyDash">
        <div class="emptyTitle">No saved views yet</div>
        <div class="muted small">
          <div>Saved views let you reopen your favourite compares in one click instead of rebuilding them every time.</div>
          <div style="margin-top:4px;">Run a compare, hit <b>Save View</b>, and we’ll keep your latest 12 setups here.</div>
        </div>
        <a class="btnInline" href="#compare" style="margin-top:10px;">Go to Compare</a>
      </div>
    `;
}

function TeaseTile(title, body, icon) {
  return `
      <div class="teaseTile">
        <div class="teaseT">
          <span style="margin-right:6px;">${icon}</span>${escapeHtml(title)}
        </div>
        <div class="muted">${escapeHtml(body)}</div>
      </div>
    `;
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
