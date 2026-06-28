// app.js renders based on route + state passed in from main.js

export function App(state) {
  const route = state.route || "compare";
  let page = "";

  const isEs = route.startsWith("es-") || route === "es";

  if (route === "pricing") page = PricingPage(state);
  else if (route === "dashboard") page = DashboardPage(state);
  else if (route === "watchlist") page = WatchlistPage(state);
  else if (route === "waitlist") page = WaitlistPage(state);
  else if (route === "account") page = AccountPage(state);
  else if (route === "reset") page = ResetPasswordPage(state);
  else if (route === "learn") page = LearnPage(state);
  else if (route === "es" || route === "es-compare") page = EsComparePage(state);
  else if (route === "es-dashboard") page = EsDashboardPage(state);
  else if (route === "es-pricing") page = EsPricingPage(state);
  else if (route === "es-waitlist") page = EsWaitlistPage(state);
  else if (route === "es-watchlist") page = EsWatchlistPage(state);
  else if (route === "es-account") page = EsAccountPage(state);
  else if (route === "es-learn") page = EsLearnPage(state);
  else if (route.startsWith("intel/")) page = IntelArticlePage(state);
  else if (route.startsWith("markets/")) page = MarketsArticlePage(state);
  else page = ComparePage(state);

  const footer     = isEs ? EsFooter()                : Footer();
  const authMod    = isEs ? EsAuthModal(state)         : AuthModal(state);
  const intelMod   = isEs ? EsIntelUpsellModal(state)  : IntelUpsellModal(state);
  const commMod    = CommunityPeekModal();
  const emailMod   = isEs ? EsEmailInsightModal(state) : EmailInsightModal(state);
  const checkoutM  = isEs ? EsCheckoutModal(state)     : CheckoutModal(state);
  const trialM     = isEs ? EsTrialModal(state)        : TrialModal(state);
  const trialSalesM = isEs ? EsTrialSalesModal(state)  : TrialSalesModal(state);

  return `${page}${footer}${authMod}${intelMod}${commMod}${emailMod}${checkoutM}${trialM}${trialSalesM}`;
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

  const trialButtonHtml = trialActive
    ? `
        <button class="accountItem highlight" id="acctTrialBtn" role="menuitem">
          <div>
            <div class="accountItemTitle">Your Premium Trial ›</div>
            <div class="muted small">Unlimited compares &amp; signals</div>
          </div>
          <span class="trialActivePill">Active</span>
        </button>
      `
    : `
        <button class="accountItem highlight" id="acctTrialBtn" role="menuitem">
          <div>
            <div class="accountItemTitle">3-day free trial</div>
            <div class="muted small">Limited offer for active users</div>
          </div>
          <span class="pillLite">New</span>
        </button>
      `;

  return `
      <div class="navWrap">
        <div class="nav">
          <a href="#compare" class="brand brandLink">
            <img src="/compareclearlogo.png" alt="CompareCrypto.ai" style="height:36px; width:auto; display:block;" onerror="this.style.display='none'; var t=this.nextElementSibling; if(t) t.style.display='inline';" />
            <span class="brandText">CompareCrypto.ai</span>
          </a>

          <div class="links">
            <a class="${is("compare")}" href="#compare">Compare</a>
            <a class="${is("dashboard")}" href="#dashboard">Dashboard</a>
            <a class="${is("pricing")}" href="#pricing">Pricing</a>
          </div>

          <div class="navRight">
            <a href="#es-compare" id="langToggleBtn" class="langToggleBtn" title="Cambiar a Español">🇲🇽 ES</a>
            <button type="button" class="navHamburgerBtn" id="navHamburgerBtn" aria-label="Open menu" aria-expanded="false">☰</button>
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

                    <button class="accountItem" id="acctWatchlistBtn" role="menuitem">
                      <span>📋 My Watchlist</span>
                      <span class="muted small">›</span>
                    </button>

                    ${trialButtonHtml}

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
        <div class="navMobileMenu" id="navMobileMenu" aria-hidden="true">
          <a class="${is("compare")}" href="#compare">Compare</a>
          <a class="${is("dashboard")}" href="#dashboard">Dashboard</a>
          <a class="${is("pricing")}" href="#pricing">Pricing</a>
        </div>
      </div>
    `;
}

/* ---------- Compare page (refined hero + clearer UX) ---------- */

function ComparePage(state) {
  const mode = state.mode || "assets";
  const usage = state.usage || { used: 0, freeLimit: 3 };
  const used = usage.used ?? 0;
  const limit = usage.freeLimit ?? 3;
  const bumped = !!state.usageBumped;
  const premiumActive = !!(state.trialUntil && state.trialUntil > Date.now());

  const modeLabel =
    mode === "assets"
      ? "Assets mode: rank coins by momentum and conviction."
      : "Exchanges mode: find the best venue to execute.";

  const modeRow = `
      <div class="modeRow">
        <div>
          <div class="segmented">
            <button class="seg ${mode === "assets" ? "active" : ""}" id="modeAssets">Assets</button>
            <button class="seg ${mode === "exchanges" ? "active" : ""}" id="modeExchanges">Exchanges</button>
          </div>
          <div class="muted small" style="margin-top:4px;">${modeLabel}</div>
        </div>
        <div class="sponsorSlotWrap">
          <button class="sponsorSlot" id="sponsorSlotBtn" title="Sponsored placements coming soon">
            Sponsored by Binance
          </button>
        </div>
        <div class="usageLine">
          <div class="usagePill ${bumped ? "usagePulse" : ""}">
            <span class="muted">Daily free comparisons</span>
            <span class="usageCount"><b>${used}</b>/<b>${limit}</b></span>
          </div>
        </div>
        <div class="usageInline" id="usageInline"></div>
      </div>
    `;

  const chips =
    mode === "assets"
      ? ["BTC", "ETH", "SOL", "ADA", "DOGE", "XRP", "AVAX", "LINK", "PEPE", "BONK"]
      : ["Coinbase", "Kraken", "Binance", "Bybit", "OKX", "Bitstamp", "KuCoin", "Gemini", "Gate.io", "MEXC"];

  const placeholder =
    mode === "assets"
      ? "Search any coin/token (e.g. BTC, ETH, SOL, XRP, AVAX, LINK, PEPE, BONK)…"
      : "Type a coin/token (BTC, ETH, SOL, PEPE) OR exchange names (Binance, Coinbase)…";

  const sourcePill = `
      <div class="sponsorPill">
        <span class="muted">Market partner</span>
        <span class="dotSep">•</span>
        <span class="logoPill logoPillImg">
          <img src="/binance-logo.svg" alt="Binance" />
        </span>
      </div>
    `;

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="hero">
            <h1 class="headline">
              Compare <span class="grad">ANY crypto</span>.
            </h1>
            <p class="sub">
              Prices, momentum, and best exchange routes on one screen.
            </p>
            <div class="heroProof">
              <span class="heroPill">Live prices</span>
              <span class="heroPill">24h + 7d momentum</span>
              <span class="heroPill">Exchange best quote</span>
              <span class="heroPill">Community ratings</span>
            </div>
            ${modeRow}
          </div>

          <div class="compareCard${premiumActive ? " compareCardPremium" : ""}">
            ${state.reopenContext ? ReopenWorkspacePanel(state) : ""}
            ${premiumActive ? '<div class="compareCardPremiumBadge">Premium</div>' : ""}

            ${premiumActive
              ? `<div class="guideRow guideRowCollapsed"><span class="muted small">Pick assets or exchanges, then Compare.</span></div>`
              : `<div class="guideRow">
              <div class="guideStep">
                <span class="guideNum">1</span>
                <span>${mode === "assets" ? "Pick 2+ assets" : "Type token or exchange"}</span>
              </div>
              <div class="guideStep">
                <span class="guideNum">2</span>
                <span>${mode === "assets" ? "Click Compare now" : "Select exchanges to compare"}</span>
              </div>
              <div class="guideStep">
                <span class="guideNum">3</span>
                <span>Act on the best setup</span>
              </div>
            </div>`
            }

            <div class="rewardToast" id="rewardToast"></div>

            ${premiumActive ? '<div class="premiumStatusBar">✦ Premium active — unlimited compares, full signals unlocked</div>' : ""}

            <div class="searchRow${premiumActive ? " searchRowPremium" : ""}">
              <input class="input${premiumActive ? " inputPremium" : ""}" id="search" placeholder="${placeholder}" />
              <button class="cta" id="compareBtn">Compare now</button>
              <button class="btnAlt" id="saveBtn">Save view</button>
            </div>

            <div class="chips" id="chips">
              ${chips.map((c) => `<button class="chip" data-chip="${c}">+ ${mode === "assets" ? "🪙" : "🏦"} ${c}</button>`).join("")}
            </div>

            <div class="chips" id="presets" style="margin-top:10px;">
              ${
                mode === "assets"
                  ? `
                <button class="chip" data-preset="majors">Majors: BTC ETH SOL</button>
                <button class="chip" data-preset="layer1">Layer 1 basket</button>
                <button class="chip" data-preset="payments">Payments: XRP XLM LTC</button>
              `
                  : `
                <button class="chip" data-preset="tier1">Tier-1 venues</button>
                <button class="chip" data-preset="alts">Altcoin-friendly venues</button>
                <button class="chip" data-preset="global">Global mix</button>
              `
              }
            </div>

            <div class="selectedRow">
              <div class="selectedList" id="selectedList"></div>
            </div>

            <div class="results" id="results">
              <div class="resultLine ok">
                <div class="resultTop">
                  <div class="resultTitle"></div>
                  <span id="dataSourceIndicator" class="dataSourceIndicator" aria-hidden="true"></span>
                  ${sourcePill}
                </div>
              </div>

              <div id="resultBody"></div>
              <div id="learnPanel"></div>
            </div>

            <div id="editorialStrip"></div>

            <div class="savedBlock" id="savedBlock"></div>
          </div>
        </div>

        ${LimitModal()}
        ${InsightsModal()}
        ${ExchangeInsightModal()}
      </div>
    `;
}

/* ---------- Dashboard page ---------- */

function DashboardPage(state) {
  const views = state.savedViews || [];
  const count = views.length;

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="pageHdr pageHdrDash">
            <div class="pageActions pageActionsLeft">
              <button class="btnAlt btnWithIcon" id="dashCompareBtn"><span aria-hidden="true">⚡</span><span>Run a compare</span></button>
              <button class="btn btnWithIcon" id="goPremiumBtn"><span aria-hidden="true">👑</span><span>Unlock Premium</span></button>
            </div>
          </div>

          <div class="dashStory">
            <div class="dashStoryTop">
              <div class="dashStoryTitle">Why compare crypto before you act?</div>
              <div class="muted small">This product helps you make faster, better decisions with less guesswork.</div>
            </div>

            <div class="dashStoryGrid">
              <div class="dashStoryCard">
                <div class="dashStoryK">Pick stronger assets</div>
                <div class="muted small">Compare 24h and 7d momentum side by side to avoid chasing random moves.</div>
              </div>
              <div class="dashStoryCard">
                <div class="dashStoryK">Get better execution</div>
                <div class="muted small">Scan exchange price differences so buys and sells happen on better venues.</div>
              </div>
              <div class="dashStoryCard">
                <div class="dashStoryK">Use community sentiment edge</div>
                <div class="muted small">Combine crowd conviction with momentum so you can spot higher-confidence setups earlier.</div>
              </div>
            </div>

            <div class="dashStoryCtas">
              <button class="btnMini" id="dashHowBtn">How to use this in 60s</button>
              ${state.user ? `<button class="btnMiniGhost btnWithIcon" id="dashEmailInsightBtn"><span aria-hidden="true">📩</span><span>Get weekly insight email</span></button>` : `<button class="btnMiniGhost" id="dashSignupBtn">Create free account</button>`}
            </div>
          </div>

          <div class="marketWindow" id="marketWindow">
            <div class="marketWindowHead">
              <div class="dashStoryTitle" style="font-size:18px;">Market Pulse</div>
              <div class="marketModes">
                <button class="marketModeBtn active" id="pulseMarketBtn">Markets</button>
                <button class="marketModeBtn" id="pulseCommunityBtn">Community sentiment</button>
              </div>
            </div>
            <div class="muted small" id="marketPulseNote" style="margin-top:6px;"></div>
            <div class="marketGrid" id="marketGrid"></div>
          </div>

          ${DashboardIntelStrip()}

          <div class="savedHdr">
            <div>
              <div class="savedTitle">Saved compares</div>
              <div class="muted small">Open any saved setup and refresh it against live market data.</div>
            </div>
            <div class="savedBtns">
              <button class="btnAlt" id="clearSavedBtn">Clear saved</button>
            </div>
          </div>

          <div class="dashGrid">
            ${views.length ? views.map(ViewCard).join("") : EmptyDash()}
          </div>
        </div>
      </div>
    `;
}

function DashboardIntelStrip() {
  const cards = [
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

  return `
      <div class="newsStrip" style="margin-top:14px;">
        <div class="newsHdr">
          <div class="k">Market intel</div>
          <button class="btnMiniGhost" id="dashIntelBtn">More intel</button>
        </div>
        <div class="newsGrid">
          ${cards
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
                <div class="muted small" style="margin-top:4px;">Earned from total comparisons you've run.</div>
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
            ${BillingCard(state)}
            ${ReferralCard(state)}
          </div>
        </div>
      </div>
    `;
}

function BillingCard(state) {
  const now = Date.now();
  const trialUntil = state.trialUntil;
  const trialActive = trialUntil && trialUntil > now;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const premiumPaying = trialActive && (trialUntil - now) > thirtyDaysMs;

  if (premiumPaying) {
    const planLabel = state.billingPlan === "yearly" ? "Yearly" : state.billingPlan === "monthly" ? "Monthly" : "";
    const planLine = planLabel ? ` (${planLabel})` : "";
    return `
            <div class="plan billingCard">
              <div class="planTitle">Billing</div>
              <div class="billingHeadline">You're on Premium ✦</div>
              <div class="muted small" style="margin-top:6px;">Unlimited compares, full signals, all features unlocked${planLine}</div>
              <button class="btnFull" id="billingManageBtn" style="margin-top:14px;">Manage Billing →</button>
            </div>`;
  }

  if (trialActive) {
    const countdownShort = `Expires in ${formatTrialCountdownShort(trialUntil)}`;
    return `
            <div class="plan billingCard billingCardTrial">
              <div class="planTitle">Billing</div>
              <div class="billingHeadline">You're on Premium Trial</div>
              <div class="billingCountdown" id="billingCountdown">${escapeHtml(countdownShort)}</div>
              <div class="billingUrgency">Lock in your rate before your trial ends</div>
              <button class="cta btnFull" id="billingUpgradeNowBtn" style="margin-top:14px;">Upgrade Now — from $20/month →</button>
              <div class="muted small" style="margin-top:10px;">
                <a href="#" id="billingYearlyLink">View yearly plan (save 17%)</a>
              </div>
            </div>`;
  }

  return `
            <div class="plan billingCard">
              <div class="planTitle">Billing</div>
              <div class="billingHeadline">You're on the Free plan</div>
              <div class="muted small" style="margin-top:6px;">3 free compares per day. No signals. No predictions.</div>
              <button class="cta btnFull" id="billingUnlockPremiumBtn" style="margin-top:14px;">Unlock Premium →</button>
              <div class="muted small" style="margin-top:10px;">
                <a href="#" id="billingTrialLink">Or start a 3-day free trial</a>
              </div>
            </div>`;
}

function formatTrialCountdownShort(untilMs) {
  const now = Date.now();
  let rem = Math.max(0, Math.floor((untilMs - now) / 1000));
  const d = Math.floor(rem / 86400);
  rem %= 86400;
  const h = Math.floor(rem / 3600);
  rem %= 3600;
  const m = Math.floor(rem / 60);
  return `${d}d ${h}h ${m}m`;
}

function ReferralCard(state) {
  const referralCode = state.referralCode || "------";
  const refCount = state.referralCount ?? 0;
  const baseUrl = "https://comparecrypto.ai";
  const refLink = `${baseUrl}?ref=${referralCode}`;
  const emailSubject = "I've been using CompareCrypto.ai — you should try it";
  const emailBody = `Hey, I've been using CompareCrypto.ai to compare crypto assets and exchange rates. Use my referral link to get 3 days of Premium free: ${refLink}`;
  const tweetText = encodeURIComponent(`Just found @CompareCryptoAI — the best way to compare crypto assets and exchange rates. Get 3 days Premium free with my link: ${refLink}`);

  return `
            <div class="plan referralCard">
              <div class="referralHeadline">Refer & Earn — give 3 days, get 3 days</div>
              <button type="button" class="referralRevealTeaser" id="referralRevealBtn">
                <span class="referralRevealTeaserText">Reveal your referral code</span>
                <span class="referralRevealChevron" aria-hidden="true">▼</span>
              </button>
              <div id="referralRevealContent" class="referralRevealContent">
                <div class="muted small" style="margin-top:14px;">Your referral code</div>
                <div class="referralCodeBlock" id="referralCodeDisplay">${escapeHtml(referralCode)}</div>
                <div class="muted small" style="margin-top:10px;">Share your link:</div>
                <div class="referralShareRow">
                  <button type="button" class="referralShareBtn" id="referralCopyBtn" title="Copy link">📋 Copy link</button>
                  <a href="mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}" class="referralShareBtn referralShareLink" title="Share via email">✉️ Email</a>
                  <a href="https://twitter.com/intent/tweet?text=${tweetText}" target="_blank" rel="noopener noreferrer" class="referralShareBtn referralShareLink" title="Share on X">𝕏 Share</a>
                </div>
                <div id="referralCountLine" class="referralCountLine muted small">You've referred ${refCount} friend${refCount !== 1 ? "s" : ""} — ${refCount} × 3 days earned</div>
              </div>
            </div>`;
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
    ? `<div class="trialBanner">You're on a 3-day Premium trial. Enjoy unlimited compares and signals for the next ${trialDaysLeft} day${
        trialDaysLeft > 1 ? "s" : ""
      }.</div>`
    : "";

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="pricingHero">
            <div class="kicker jumbo">Unlock Premium Edge</div>
            <div class="muted">Stop waiting for tomorrow. Get unlimited compares, arbitrage alerts, and saved dashboards — so you can act when the market moves.</div>
            ${trialBanner}
          </div>

          <div class="grid2">
            <div class="plan">
              <div class="planTitle">Monthly</div>
              <div class="price">$20<span>/month</span></div>
              <ul>
                <li><b>Unlimited comparisons</b> — no daily cap</li>
                <li>Saved views + dashboards</li>
                <li>Arbitrage alerts when spreads spike</li>
                <li>Community prediction overlays</li>
              </ul>
              <button class="btnFull" id="checkoutMonthly">Continue to Checkout</button>
            </div>

            <div class="plan glow">
              <div class="save">BEST VALUE — SAVE $40</div>
              <div class="planTitle">Yearly</div>
              <div class="price">$200<span>/year</span></div>
              <div class="muted small">($16.67/month — 2 months free)</div>
              <ul>
                <li>Everything in Monthly</li>
                <li>Priority feature access</li>
                <li><b>AI Trading Bot access (beta)</b></li>
                <li>Partner offers + fee discounts</li>
              </ul>
              <button class="cta btnFull" id="checkoutYearly">Continue to Checkout</button>
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
            <div class="kicker jumbo">Checkout access list</div>
            <div class="muted">Drop your email and we'll send you the instant checkout link once connected.</div>
          </div>

          <div class="compareCard">
            <div class="hint">The compare product is fully usable now. This form is only for payment launch notice.</div>

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
              <div class="modalTitle">You've used your 3 free compares today</div>
              <div class="muted">Traders who upgrade get unlimited scans — no more waiting until tomorrow.</div>
            </div>
            <button class="x" id="closeLimit">✕</button>
          </div>

          <div class="insList" style="padding:8px 0;">
            <div class="bullet">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">∞</span>
                <div>
                  <div style="font-weight:700;">Unlimited comparisons</div>
                  <div class="muted small">Run as many scans as you need — no daily cap.</div>
                </div>
              </div>
            </div>
            <div class="bullet" style="margin-top:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">⚡</span>
                <div>
                  <div style="font-weight:700;">Arbitrage alerts</div>
                  <div class="muted small">Get notified when spreads spike on your tracked exchanges.</div>
                </div>
              </div>
            </div>
            <div class="bullet" style="margin-top:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">📊</span>
                <div>
                  <div style="font-weight:700;">Saved dashboards</div>
                  <div class="muted small">Pin your best setups and reopen them in one click.</div>
                </div>
              </div>
            </div>
            <div class="bullet" style="margin-top:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">🤖</span>
                <div>
                  <div style="font-weight:700;">AI Trading Bot access</div>
                  <div class="muted small">Unlock bot access on Premium plans as this feature rolls out.</div>
                </div>
              </div>
            </div>
          </div>

          <div class="referralBar">
            <input class="input" id="referralCodeInput" placeholder="Referral code (try: crypto)" />
            <button class="btnAlt" id="applyReferralCodeBtn">Apply</button>
          </div>
          <div class="muted small" id="referralStatus" style="margin-top:8px;"></div>

          <div class="modalCtas">
            <button class="ctaWide" id="goPricingFromLimit">Unlock Premium — $20/mo</button>
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
              <b>Premium edge:</b> Get early shift alerts when the crowd flips, track conviction over time, and unlock AI "what's next" overlays.
            </div>
          </div>

          <div class="modalCtas">
            <button class="ghostWide" id="createAlert">Set alert (2 free with account)</button>
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

          <div class="finePrint">Use exchange insights to compare execution quality, fees, and regional availability before funding.</div>
        </div>
      </div>
    `;
}

function CheckoutModal(state) {
  const plan = state._checkoutPlan || "monthly";
  const planLabel = plan === "yearly" ? "Yearly" : "Monthly";
  const planPrice = plan === "yearly" ? "$200/year" : "$20/month";
  const prefillEmail = state.user?.email || "";

  return `
      <div class="modalBackdrop" id="checkoutModal">
        <div class="modal checkoutModalSize">
          <div class="modalTop">
            <div>
              <div class="modalTitle" id="checkoutPlanTitle">${planLabel} — ${planPrice}</div>
              <div class="muted">Complete your purchase.</div>
            </div>
            <button class="x" id="closeCheckout" aria-label="Close">✕</button>
          </div>

          <div id="checkoutModalContent">
            <div class="checkoutForm">
              <div class="bullet" style="margin-top:0;">
                <div class="muted small">Full name</div>
                <input class="input checkoutInput" id="checkoutFullName" type="text" placeholder="Jane Doe" />
              </div>

              <div class="bullet" style="margin-top:10px;">
                <div class="muted small">Email</div>
                <input class="input checkoutInput" id="checkoutEmail" type="text" placeholder="you@domain.com" value="${escapeHtml(prefillEmail)}" />
              </div>

              <div class="bullet" style="margin-top:10px;">
                <div class="muted small">Card number</div>
                <input class="input checkoutCardNumber" id="checkoutCardNumber" type="text" inputmode="numeric" placeholder="4242 4242 4242 4242" maxlength="19" />
              </div>

              <div class="checkoutRow">
                <div class="bullet" style="margin-top:10px; flex:1;">
                  <div class="muted small">Expiry (MM/YY)</div>
                  <input class="input checkoutInput" id="checkoutExpiry" type="text" placeholder="12/28" maxlength="5" />
                </div>
                <div class="bullet" style="margin-top:10px; flex:1;">
                  <div class="muted small">CVV</div>
                  <input class="input checkoutInput" id="checkoutCvv" type="text" inputmode="numeric" placeholder="123" maxlength="4" />
                </div>
              </div>

              <div class="bullet" style="margin-top:10px;">
                <div class="muted small">Billing ZIP</div>
                <input class="input checkoutInput" id="checkoutZip" type="text" placeholder="10001" />
              </div>

              <div class="modalCtas" style="margin-top:16px;">
                <button class="ctaWide" id="checkoutPayBtn">Pay Now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
}

function TrialModal(state) {
  const trialUntil = state.trialUntil || Date.now() + 3 * 24 * 60 * 60 * 1000;
  const initialCountdown = formatTrialCountdown(trialUntil);

  return `
      <div class="modalBackdrop" id="trialModal">
        <div class="modal trialModalSize">
          <div class="modalTop trialModalTop">
            <div>
              <div class="trialModalHeadline">Your 3-day Premium trial is live 🎉</div>
              <div class="trialCountdown" id="trialCountdown">${initialCountdown}</div>
            </div>
            <button class="x" id="closeTrialModal" aria-label="Close">✕</button>
          </div>

          <div class="trialUnlockedSection">
            <div class="trialUnlockedTitle">What you just unlocked</div>
            <div class="trialUnlockedGrid">
              <div class="trialUnlockedItem">
                <span class="trialUnlockedIcon">✦</span>
                <span>Community Predictions (24H) — see where the crowd thinks prices are going</span>
              </div>
              <div class="trialUnlockedItem">
                <span class="trialUnlockedIcon">✦</span>
                <span>Exchange Signals — best execution routes across 6+ exchanges</span>
              </div>
              <div class="trialUnlockedItem">
                <span class="trialUnlockedIcon">✦</span>
                <span>Sentiment Shift Alerts — get notified when sentiment flips</span>
              </div>
              <div class="trialUnlockedItem">
                <span class="trialUnlockedIcon">✦</span>
                <span>Full Risk Intelligence — deep risk scoring per asset</span>
              </div>
            </div>
          </div>

          <div class="modalCtas trialModalCtas">
            <button class="cta ctaTrialModal" id="trialModalCta">Run my first Premium compare →</button>
          </div>
        </div>
      </div>
    `;
}

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

function TrialSalesModal(state) {
  const trialUntil = state.trialUntil || Date.now();
  const initialCountdown = formatTrialCountdown(trialUntil);
  const compares = state.lifetimeCompares || 0;
  const savedCount = (state.savedViews || []).length;
  const now = Date.now();
  const hoursLeft = state.trialUntil && state.trialUntil > now
    ? Math.max(1, Math.ceil((state.trialUntil - now) / (60 * 60 * 1000)))
    : 0;

  return `
      <div class="modalBackdrop" id="trialSalesModal">
        <div class="modal trialSalesModalSize">
          <div class="modalTop">
            <div>
              <div class="modalTitle">You're on Premium — make it permanent</div>
              <div class="trialSalesCountdown" id="trialSalesCountdown">${initialCountdown}</div>
            </div>
          </div>

          <div class="trialSalesUsage">
            You've run <b>${compares}</b> compare${compares !== 1 ? "s" : ""} and saved <b>${savedCount}</b> view${savedCount !== 1 ? "s" : ""}.
          </div>

          <div class="trialSalesLoseSection">
            <div class="trialUnlockedTitle">What you'll lose when trial ends</div>
            <div class="trialSalesLoseGrid">
              <div class="trialSalesLoseItem"><span class="trialSalesLoseIcon" aria-hidden="true">✕</span><span>Community Predictions</span></div>
              <div class="trialSalesLoseItem"><span class="trialSalesLoseIcon" aria-hidden="true">✕</span><span>Exchange Signals</span></div>
              <div class="trialSalesLoseItem"><span class="trialSalesLoseIcon" aria-hidden="true">✕</span><span>Sentiment Alerts</span></div>
              <div class="trialSalesLoseItem"><span class="trialSalesLoseIcon" aria-hidden="true">✕</span><span>Full Risk Intelligence</span></div>
            </div>
          </div>

          <div class="trialSalesSocialProof">Join 2,400+ traders already on Premium</div>
          <div class="trialSalesUrgency">Your trial expires in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} — upgrade now to keep everything</div>

          <div class="modalCtas trialSalesCtas">
            <button class="cta ctaTrialSales" id="trialSalesUpgradeBtn">Upgrade Now — Lock In Your Rate →</button>
          </div>
          <div class="trialSalesSecondary">
            <a href="#" class="trialSalesRemindLink" id="trialSalesRemindBtn">Remind me tomorrow</a>
          </div>
        </div>
      </div>
    `;
}

function EmailInsightModal(state) {
  const prefill = state?.user?.email || "";
  return `
      <div class="modalBackdrop" id="emailInsightModal">
        <div class="modal modalEmailInsight big">
          <div class="modalTop modalEmailInsightTop">
            <div class="modalEmailInsightHead">
              <h2 class="modalEmailInsightTitle">Weekly Market Insight</h2>
              <p class="modalEmailInsightSubline">One high-signal crypto brief, every week. No noise, no spam.</p>
            </div>
            <button class="x" id="closeEmailInsight" aria-label="Close">✕</button>
          </div>

          <div class="emailInsightHeroWrap">
            <img class="emailInsightHeroImage" src="/emailsignup.png" alt="" onerror="this.style.display='none'" />
          </div>

          <div id="emailInsightFormArea">
            <div class="modalEmailInsightForm">
              <label class="muted small" for="weeklyEmailInput">Email</label>
              <input class="input" id="weeklyEmailInput" type="email" placeholder="you@domain.com" value="${escapeHtml(prefill)}" />
              <div class="muted small" id="weeklyEmailStatus" aria-live="polite"></div>
            </div>

            <div class="modalCtas modalEmailInsightCtas">
              <button class="ctaWide ctaEmailInsight" id="sendInsightEmail">Send me the weekly edge →</button>
            </div>

            <div class="finePrint modalEmailInsightFinePrint">Unsubscribe anytime. We send once a week.</div>
          </div>
        </div>
      </div>
    `;
}

function IntelUpsellModal(state) {
  const authed = !!state?.user;
  return `
      <div class="modalBackdrop" id="intelModal">
        <div class="modal">
          <div class="modalTop">
            <div>
              <div class="modalTitle">Unlock Premium Intel</div>
              <div class="muted">${
                authed
                  ? "You’re signed in. Upgrade to unlock deeper sponsored research and premium intel briefs."
                  : "Get deeper sponsored research, private briefings, and community alpha threads."
              }</div>
            </div>
            <button class="x" id="closeIntelModal">✕</button>
          </div>

          <div class="insList" style="padding:8px 0;">
            <div class="bullet" style="margin-top:0;">
              <b>Sponsored by Binance</b>
              <div class="muted small" style="margin-top:6px;">Premium members get deeper exchange intel and monthly featured deep-dives.</div>
            </div>
          </div>

          <div class="modalCtas">
            ${
              authed
                ? `<button class="ghostWide" id="openAuthFromIntel">Manage account</button>
                   <button class="ctaWide" id="goPricingFromIntel">Upgrade to Premium</button>`
                : `<button class="ghostWide" id="openAuthFromIntel">Create free account</button>
                   <button class="ctaWide" id="goPricingFromIntel">View Premium</button>`
            }
          </div>
        </div>
      </div>
    `;
}

function IntelArticlePage(state) {
  const slug = (state.route || "").replace("intel/", "");
  const articles = {
    "how-to-research-altcoins": {
      title: "How To Research Altcoins Before You Buy",
      deck: "A practical survival framework for filtering noise, avoiding weak launches, and focusing on projects that can actually last.",
      sponsor: "Sponsored Research by Binance",
      heroImage: "/intel/cards/how-to-research-altcoins.png",
      stats: [
        { k: "Failure reality", v: "Most new tokens fail" },
        { k: "Default stance", v: "Assume zero until proven otherwise" },
        { k: "Primary edge", v: "Discipline beats hype" },
      ],
      sections: [
        {
          h: "1) Start With Survival, Not Hype",
          p: "Treat every new altcoin as guilty until proven innocent. Most launches are short-lived, so your first job is filtering for durability.",
          bullets: [
            "Prefer assets that have traded through at least 12–18 months of real market conditions.",
            "Prioritize listings on liquid, reputable venues over micro-only listings.",
            "Use position sizing that is tiny relative to daily volume and depth.",
          ],
          takeaway: "If liquidity is thin and age is short, move on.",
          img: "/intel/sections/step1.png",
        },
        {
          h: "2) Validate Real Use Case + Token Design",
          p: "Good projects can explain their value in plain English. If the token is not necessary to the product, long-term demand is fragile.",
          bullets: [
            "Define the exact user problem solved better than incumbents.",
            "Check if users exist now, not just in roadmap narratives.",
            "Inspect supply schedule, unlock cliffs, and inflation pressure.",
          ],
          takeaway: "Complicated tokenomics usually benefit insiders first.",
          img: "/intel/sections/step2.png",
        },
        {
          h: "3) Confirm With On-Chain and Team Execution",
          p: "On-chain activity is one of the few signals you can verify. Pair that with team quality and governance reality.",
          bullets: [
            "Track active addresses, transaction value, and fee dynamics over time.",
            "Review wallet concentration and whale dominance risk.",
            "Favor transparent teams, active repos, and clear audit history.",
          ],
          takeaway: "If usage is falling while price pumps, conviction is weak.",
          img: "/intel/sections/step3.png",
        },
      ],
    },
    "exchange-execution-playbook": {
      title: "Exchange Execution Playbook: Get Better Fills",
      deck: "Execution is edge. Venue selection, order type, and sizing discipline can save more than fees ever will.",
      sponsor: "Sponsored Research by Binance",
      heroImage: "/intel/cards/exchange-execution-playbook.png",
      stats: [
        { k: "Core risk", v: "Slippage and liquidity fragmentation" },
        { k: "Hidden cost", v: "Spread + fees + execution quality" },
        { k: "Execution rule", v: "Slow is smooth, smooth is fast" },
      ],
      sections: [
        {
          h: "1) Choose Venue and Pair Intentionally",
          p: "The same token can have very different liquidity depending on venue and quote pair. That difference directly impacts fill quality.",
          bullets: [
            "Compare quotes across top venues before each meaningful order.",
            "Use deepest USD/USDT pairs when possible; convert separately if needed.",
            "Avoid structurally thin pairs during high-volatility windows.",
          ],
          takeaway: "Best visible price is useless if the book cannot absorb your size.",
          img: "/intel/sections/exchange1.png",
        },
        {
          h: "2) Match Order Type to Market Conditions",
          p: "Market orders are speed tools, not default tools. In thin books they can turn manageable risk into immediate damage.",
          bullets: [
            "Use limit orders for altcoins and larger entries.",
            "Use maker/post-only behavior when fee structure favors it.",
            "Expect worse slippage during event risk or panic liquidity drops.",
          ],
          takeaway: "On illiquid books, aggressive market buys are donation mode.",
          img: "/intel/sections/exchange2.png",
        },
        {
          h: "3) Slice Size and Price In Total Cost",
          p: "Execution quality should be measured as all-in cost, not just displayed fee rates.",
          bullets: [
            "Split larger orders into tranches (manual laddering or time slicing).",
            "Track spread + slippage + trading fee + funding (for perps).",
            "For DEX trades, include pool depth and gas as first-class costs.",
          ],
          takeaway: "Good execution won’t make every trade win, but bad execution can make every trade worse.",
          img: "/intel/sections/exchange3.png",
        },
      ],
    },
    "community-conviction-framework": {
      title: "Community Conviction Framework",
      deck: "Separate real believers from short-term tourists by combining on-chain engagement with community quality.",
      sponsor: "Sponsored Research by Binance",
      heroImage: "/intel/cards/community-conviction-framework.png",
      stats: [
        { k: "Signal type", v: "Usage + behavior through drawdowns" },
        { k: "False signal", v: "Social hype without on-chain follow-through" },
        { k: "Best setup", v: "Momentum aligned with rising participation" },
      ],
      sections: [
        {
          h: "1) Track On-Chain Engagement First",
          p: "Conviction should show up in measurable usage, not just posts. Rising participation often leads durable trend phases.",
          bullets: [
            "Follow active addresses, transaction value, and fee participation.",
            "Watch for sustained improvement, not one-off campaign spikes.",
            "Treat price rallies without usage growth as fragile.",
          ],
          takeaway: "If users vanish, conviction is narrative-only.",
          img: "/intel/sections/community1.png",
        },
        {
          h: "2) Inspect Holder Base Quality",
          p: "Who holds the supply matters as much as how many people mention the token online.",
          bullets: [
            "Measure concentration risk across top wallets.",
            "Look for long-horizon holders, not only recent speculators.",
            "Monitor exchange balances vs self-custody behavior.",
          ],
          takeaway: "Distributed ownership is more resilient than whale-dominated supply.",
          img: "/intel/sections/community2.png",
        },
        {
          h: "3) Stress-Test During Bear Conditions",
          p: "The strongest conviction signal appears when price is weak but builders and users remain active.",
          bullets: [
            "Check whether development cadence survives drawdowns.",
            "Look for a usage floor rather than total collapse.",
            "Prefer communities producing tools and documentation over pure hype loops.",
          ],
          takeaway: "Real conviction compounds quietly before the next expansion phase.",
          img: "/intel/sections/community3.png",
        },
      ],
    },
  };

  const a = articles[slug] || articles["how-to-research-altcoins"];

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="intelHero">
            <div class="intelSponsor">${a.sponsor}</div>
            <h1 class="intelTitle">${escapeHtml(a.title)}</h1>
            <p class="intelDeck">${escapeHtml(a.deck)}</p>
            <img class="intelHeroImage" src="${escapeHtml(a.heroImage)}" alt="${escapeHtml(a.title)} hero image" />
            <div class="intelStatGrid">
              ${a.stats
                .map(
                  (s) => `
                <div class="intelStatCard">
                  <div class="intelStatK">${escapeHtml(s.k)}</div>
                  <div class="intelStatV">${escapeHtml(s.v)}</div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="intelBody">
            ${a.sections
              .map(
                (s, i) => `
              <section class="intelSection parallaxStep ${i % 2 ? "rev" : ""}" style="animation-delay:${i * 140}ms;">
                <div class="intelSectionCopy">
                  <h2>${escapeHtml(s.h)}</h2>
                  <p class="intelSectionLead">${escapeHtml(s.p)}</p>
                  <ul class="intelChecklist">
                    ${(s.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
                  </ul>
                  <div class="intelTakeaway">${escapeHtml(s.takeaway || "")}</div>
                </div>
                <div class="intelMediaWrap">
                  <img class="intelSectionImage" src="${escapeHtml(s.img)}" alt="${escapeHtml(s.h)} visual" />
                </div>
              </section>
            `
              )
              .join("")}
          </div>

          <div class="intelCtaRow">
            <a class="btnAlt" href="#compare">Back to compare</a>
            <button class="cta" id="intelMoreBtn">More intel</button>
          </div>
        </div>
      </div>
    `;
}

function MarketsArticlePage(state) {
  const slug = (state.route || "").replace("markets/", "");
  const pages = {
    "btc-outlook-2027": {
      title: "BTC Outlook for 2027",
      deck: "A strategic look at possible Bitcoin paths into 2027, from adoption curves to macro liquidity cycles.",
      sponsor: "Market Research by CompareCrypto.ai",
      heroImage: "/intel/cards/how-to-research-altcoins.png",
      stats: [
        { k: "Lens", v: "Long-cycle trend + adoption" },
        { k: "Risk", v: "Macro liquidity and policy shifts" },
        { k: "Setup", v: "Positioning over prediction" },
      ],
      sections: [
        { h: "Adoption trajectory", p: "Placeholder content for BTC 2027 thesis.", bullets: ["Institutional demand cycles", "ETF flow behavior", "Supply dynamics post-halving"], takeaway: "BTC remains the benchmark risk barometer for crypto.", img: "/intel/sections/step1.png" },
        { h: "Macro regime shifts", p: "Placeholder content for interest rates and liquidity impacts.", bullets: ["Dollar strength", "Real yields", "Global risk appetite"], takeaway: "Macro context often dominates short-term BTC direction.", img: "/intel/sections/step2.png" },
        { h: "Execution framework", p: "Placeholder content for long-horizon accumulation strategy.", bullets: ["Risk budgeting", "Drawdown planning", "Scenario-based sizing"], takeaway: "Discipline outperforms narrative chasing.", img: "/intel/sections/step3.png" },
      ],
    },
    "crypto-vs-nasdaq": {
      title: "Crypto vs NASDAQ",
      deck: "How crypto risk behaves relative to tech-heavy equities, and when correlation can break.",
      sponsor: "Market Research by CompareCrypto.ai",
      heroImage: "/intel/cards/exchange-execution-playbook.png",
      stats: [
        { k: "Comparison", v: "High-beta tech vs crypto beta" },
        { k: "Focus", v: "Correlation and divergence" },
        { k: "Use case", v: "Portfolio risk context" },
      ],
      sections: [
        { h: "Correlation windows", p: "Placeholder content comparing regimes where crypto tracks NASDAQ.", bullets: ["Liquidity expansion phases", "Risk-on behavior", "Volatility clustering"], takeaway: "Correlation is dynamic, not static.", img: "/intel/sections/exchange1.png" },
        { h: "Divergence events", p: "Placeholder content for idiosyncratic crypto catalysts.", bullets: ["Regulatory catalysts", "ETF/flow shifts", "Protocol-specific shocks"], takeaway: "Divergences often create alpha opportunities.", img: "/intel/sections/exchange2.png" },
        { h: "Positioning playbook", p: "Placeholder content for balancing equity and crypto exposure.", bullets: ["Beta-adjusted sizing", "Hedge timing", "Conviction weighting"], takeaway: "Cross-asset framing improves risk decisions.", img: "/intel/sections/exchange3.png" },
      ],
    },
    "crypto-vs-sp500": {
      title: "Crypto vs S&P 500",
      deck: "A practical framework for comparing crypto momentum against broad-market risk appetite.",
      sponsor: "Market Research by CompareCrypto.ai",
      heroImage: "/intel/cards/community-conviction-framework.png",
      stats: [
        { k: "Comparison", v: "Digital risk vs broad equity market" },
        { k: "Signal", v: "Relative momentum context" },
        { k: "Use case", v: "Macro-aware decision support" },
      ],
      sections: [
        { h: "Risk appetite context", p: "Placeholder content on SPX trend phases and crypto spillover.", bullets: ["Earnings regime", "Policy backdrop", "Sentiment rotation"], takeaway: "SPX can frame broad risk tolerance.", img: "/intel/sections/community1.png" },
        { h: "Relative strength", p: "Placeholder content on when crypto outperforms traditional beta.", bullets: ["Leadership shifts", "Flow concentration", "Volatility asymmetry"], takeaway: "Relative strength beats absolute narratives.", img: "/intel/sections/community2.png" },
        { h: "Execution implications", p: "Placeholder content for integrating cross-market signals.", bullets: ["Entry timing", "Risk overlays", "Exit discipline"], takeaway: "Cross-market context reduces blind spots.", img: "/intel/sections/community3.png" },
      ],
    },
  };

  const a = pages[slug] || pages["btc-outlook-2027"];
  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="intelHero">
            <div class="intelSponsor">${a.sponsor}</div>
            <h1 class="intelTitle">${escapeHtml(a.title)}</h1>
            <p class="intelDeck">${escapeHtml(a.deck)}</p>
            <img class="intelHeroImage" src="${escapeHtml(a.heroImage)}" alt="${escapeHtml(a.title)} hero image" />
            <div class="intelStatGrid">
              ${a.stats.map((s) => `<div class="intelStatCard"><div class="intelStatK">${escapeHtml(s.k)}</div><div class="intelStatV">${escapeHtml(s.v)}</div></div>`).join("")}
            </div>
          </div>
          <div class="intelBody">
            ${a.sections
              .map(
                (s, i) => `
              <section class="intelSection parallaxStep ${i % 2 ? "rev" : ""}" style="animation-delay:${i * 140}ms;">
                <div class="intelSectionCopy">
                  <h2>${escapeHtml(s.h)}</h2>
                  <p class="intelSectionLead">${escapeHtml(s.p)}</p>
                  <ul class="intelChecklist">${(s.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
                  <div class="intelTakeaway">${escapeHtml(s.takeaway || "")}</div>
                </div>
                <div class="intelMediaWrap">
                  <img class="intelSectionImage" src="${escapeHtml(s.img)}" alt="${escapeHtml(s.h)} visual" />
                </div>
              </section>
            `
              )
              .join("")}
          </div>
          <div class="intelCtaRow">
            <a class="btnAlt" href="#dashboard">Back to dashboard</a>
            <button class="cta" id="intelMoreBtn">More intel</button>
          </div>
        </div>
      </div>
    `;
}

function CommunityPeekModal() {
  return `
      <div class="modalBackdrop" id="communityPeekModal">
        <div class="modal big">
          <div class="modalTop">
            <div>
              <div class="modalTitle" id="communityPeekTitle">Premium AI Insights</div>
              <div class="muted" id="communityPeekSubtitle">Chat with our AI trading copilot using community signal context.</div>
            </div>
            <button class="x" id="closeCommunityPeek">✕</button>
          </div>

          <div class="insList" style="padding:8px 0;">
            <div class="aiThread" id="communityPeekThread"></div>

            <div class="aiLockCard" id="communityPeekLock" hidden>
              <div class="aiLockTitle">Want more?</div>
              <div class="muted small">Unlock Premium AI to continue this conversation with deeper conviction, risk, and execution detail.</div>
              <button class="ctaWide" id="communityPeekInlineUpgrade" style="margin-top:10px;">Unlock Premium AI</button>
            </div>

            <div class="aiSuggestions">
              <button class="chip aiPrompt" data-aiq="Where could this crypto be in 2 weeks?">Where could this be in 2 weeks?</button>
              <button class="chip aiPrompt" data-aiq="What invalidates this setup?">What invalidates this setup?</button>
              <button class="chip aiPrompt" data-aiq="What is the best risk-managed entry plan?">Best risk-managed entry plan?</button>
            </div>

            <div class="bullet" style="margin-top:10px;">
              <div class="muted small">Reply</div>
              <input class="input" id="communityPeekInput" placeholder="Ask the AI trading bot…" />
              <button class="btnMini" id="communityPeekSend" style="margin-top:8px;">Send reply</button>
            </div>
          </div>

          <div class="modalCtas">
            <button class="ghostWide" id="communityPeekAccount">Create free account</button>
            <button class="ctaWide" id="communityPeekUpgrade">Unlock Premium AI</button>
          </div>

          <div class="modalCtas" style="padding-top:10px;">
            <button class="btnAlt" id="continueChatGPT">Continue in ChatGPT</button>
            <button class="btnAlt" id="continueClaude">Continue in Claude</button>
          </div>
        </div>
      </div>
    `;
}

function ReopenWorkspacePanel(state) {
  const ctx = state.reopenContext || {};
  const when = ctx.ts ? new Date(ctx.ts).toLocaleString() : "recently";
  const setupLabel = ctx.mode === "exchanges" ? "Exchange execution" : "Asset conviction";
  const items = (ctx.items || []).filter(Boolean);
  const insights = buildSavedSetupInsights(state.lastCompareResult, ctx);

  return `
      <div class="reopenWorkspace">
        <div class="reopenTop">
          <div class="reopenTitle">Pro Insight: Saved Setup Brief</div>
          <div class="muted small">Opened from Dashboard • ${escapeHtml(when)}</div>
        </div>

        <div class="reopenLead">
          ${escapeHtml(insights.lead)}
        </div>

        <div class="reopenInsightGrid">
          ${insights.cards
            .map(
              (c) => `
            <div class="reopenInsightCard">
              <div class="reopenInsightK">${escapeHtml(c.k)}</div>
              <div class="reopenInsightV">${escapeHtml(c.v)}</div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="reopenChips">
          <span class="heroPill">Focus set: ${items.length} selections</span>
          <span class="heroPill">Mode: ${escapeHtml(setupLabel)}</span>
          <span class="heroPill">Premium take: ${escapeHtml(insights.takeaway)}</span>
        </div>
      </div>
    `;
}

function buildSavedSetupInsights(result, ctx) {
  const mode = ctx?.mode || result?.kind || "assets";
  const rows = Array.isArray(result?.rows) ? result.rows : [];

  if (!rows.length) {
    return {
      lead: "Snapshot loaded. Run Compare now to refresh the latest prices and unlock deeper setup guidance.",
      takeaway: "refresh this setup for actionable direction",
      cards: [
        { k: "Status", v: "Saved setup restored" },
        { k: "Next move", v: "Run compare for live read" },
        { k: "Premium edge", v: "AI execution plan + alerts" },
      ],
    };
  }

  if (mode === "exchanges" || result?.kind === "exchanges") {
    const parsed = rows
      .map((r) => ({ ...r, _price: parsePriceDisplay(r.price) }))
      .filter((r) => Number.isFinite(r._price));

    if (!parsed.length) {
      return {
        lead: "Exchange setup reopened. Run a fresh compare to restore quote-level guidance.",
        takeaway: "check live books before placing size",
        cards: [
          { k: "Best venue", v: "Run compare" },
          { k: "Fee/slippage edge", v: "Pending live quote" },
          { k: "Community ease", v: "Pending venue score" },
        ],
      };
    }

    const byPrice = [...parsed].sort((a, b) => a._price - b._price);
    const best = byPrice[0];
    const worst = byPrice[byPrice.length - 1];
    const spreadPct = best?._price ? ((worst._price - best._price) / best._price) * 100 : 0;
    const pair = parsed.find((r) => r.pair)?.pair || `${(result?.items || [])[0] || "BTC"}/USD`;
    const easiest = [...parsed].sort((a, b) => exchangeEaseScore(b.exchange) - exchangeEaseScore(a.exchange))[0];

    return {
      lead: `${best.exchange} currently leads ${pair} execution. Versus ${worst.exchange}, this setup shows a ${spreadPct.toFixed(
        2
      )}% price gap you can avoid with venue selection.`,
      takeaway: `${best.exchange} is strongest for price; ${easiest.exchange} leads onboarding ease`,
      cards: [
        { k: "Best quote", v: `${best.exchange} at $${best._price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
        { k: "Price delta", v: `${spreadPct.toFixed(2)}% vs ${worst.exchange}` },
        { k: "Community ease", v: `${easiest.exchange} (${exchangeEaseScore(easiest.exchange)}/100)` },
      ],
    };
  }

  const parsed = rows.map((r) => ({
    ...r,
    _c24: Number(r.change24h || 0),
    _c7: Number(r.change7d || 0),
    _mcap: parseCompactMoneyValue(r.mcap),
  }));
  const momentum = [...parsed].sort((a, b) => b._c24 + b._c7 - (a._c24 + a._c7))[0];
  const conviction = [...parsed].sort((a, b) => convictionScore(b) - convictionScore(a))[0];
  const anchor = [...parsed].sort((a, b) => b._mcap - a._mcap)[0];

  return {
    lead: `${conviction.sym} shows the strongest conviction mix right now, with momentum and sentiment aligned. ${momentum.sym} is the speed leader, while ${anchor.sym} provides the size anchor.`,
    takeaway: `prioritize ${conviction.sym} for conviction, monitor ${momentum.sym} for momentum breaks`,
    cards: [
      { k: "Conviction leader", v: `${conviction.sym} (${conviction.sentiment || "Neutral"}, ${signed(conviction._c24)} 24h)` },
      { k: "Momentum leader", v: `${momentum.sym} (${signed(momentum._c24)} 24h / ${signed(momentum._c7)} 7d)` },
      { k: "Stability anchor", v: `${anchor.sym} (${anchor.mcap || "—"} market cap)` },
    ],
  };
}

function parsePriceDisplay(v) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function parseCompactMoneyValue(v) {
  const raw = String(v || "").replace(/[$,\s]/g, "").toUpperCase();
  const m = raw.match(/^(-?\d+(\.\d+)?)([KMBT])?$/);
  if (!m) return 0;
  const num = Number(m[1]);
  const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
  return num * (mult[m[3]] || 1);
}

function convictionScore(row) {
  const sent = String(row?.sentiment || "").toLowerCase();
  const sentimentBoost = sent.includes("bull") ? 3 : sent.includes("bear") ? -3 : 0;
  const risk = String(row?.risk || "").toLowerCase();
  const riskPenalty = risk === "high" ? 2 : risk === "medium" ? 1 : 0;
  return Number(row?._c24 || 0) + Number(row?._c7 || 0) + sentimentBoost - riskPenalty;
}

function exchangeEaseScore(name) {
  const key = String(name || "").toLowerCase();
  const scores = {
    coinbase: 92,
    binance: 90,
    kraken: 88,
    bybit: 85,
    okx: 84,
    gemini: 82,
    bitstamp: 80,
    kucoin: 78,
    "gate.io": 76,
    mexc: 74,
  };
  return scores[key] || 75;
}

function signed(v) {
  const n = Number(v || 0);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/* ---------- Auth modal ---------- */

function AuthModal(state) {
  const mode = state?._authMode === "signup" ? "signup" : "login";
  const authTitle = mode === "signup" ? "Create your free account" : "Welcome back";
  const authSubtitle =
    mode === "signup"
      ? "Save setups, set alerts, and keep your best compares synced."
      : "Sign in to manage your alerts, saved setups, and dashboard.";
  const toggleLabel =
    mode === "signup" ? "Already have an account? Sign in" : "New here? Create a free account";
  const nextMode = mode === "signup" ? "signup" : "login";

  return `
      <div class="modalBackdrop" id="authModal">
        <div class="modal big">

          <div class="modalTop">
            <div>
              <div class="modalTitle" id="authTitle">${authTitle}</div>
              <div class="muted" id="authSubtitle">${authSubtitle}</div>
            </div>
            <button class="x" id="closeAuth">✕</button>
          </div>

          <div class="authModalGrid">
            <div>
              <div>
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
                      <div style="font-weight:900;">Set email alerts</div>
                      <div class="muted small" style="margin-top:2px;">Free accounts include 2 alert credits to start.</div>
                    </div>
                  </div>
                </div>

                <div class="bullet" style="margin-top:8px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-size:18px;">🧠</div>
                    <div>
                      <div style="font-weight:900;">Premium signals</div>
                      <div class="muted small" style="margin-top:2px;">Unlimited alerts, deeper exchange intel, AI bot access.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="finePrint" style="padding-left:0; padding-right:0;">
                Traders use CompareCrypto.ai to scan spreads + sentiment fast — then save the winners.
              </div>
            </div>

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
                  <button class="ghostWide" id="toggleAuthModeBtn" data-mode="${nextMode}">${toggleLabel}</button>
                </div>

                <div class="finePrint">
                  No spam. Just account + product updates. You can delete your account any time.
                </div>
              </div>
            </div>
          </div>
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
        <div class="emptyTitle">No saved compares yet</div>
        <div class="muted small">
          <div>This is where your best market setups live.</div>
          <div style="margin-top:4px;">Run a compare, click <b>Save view</b>, and you'll be able to reopen it instantly when conditions change.</div>
        </div>
        <a class="btnInline" href="#compare" style="margin-top:10px;">Go to compare</a>
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

function watchlistSentClass(s) {
  const t = String(s || "").toLowerCase();
  if (t.includes("bull")) return "bull";
  if (t.includes("bear")) return "bear";
  return "neu";
}

function watchlistRiskClass(r) {
  const t = String(r || "").toLowerCase();
  if (t.includes("high")) return "rHigh";
  if (t.includes("med")) return "rMed";
  return "rLow";
}

function WatchlistPage(state) {
  const list = state.watchlist || [];
  const empty = list.length === 0;

  const cardGrid = list
    .map((item) => {
      const sent = String(item.sentiment || "Neutral");
      const sentCls = watchlistSentClass(sent);
      const risk = String(item.risk || "Medium");
      const riskCls = watchlistRiskClass(risk);
      const ch = Number(item.change24h || 0);
      const chCls = ch >= 0 ? "pos" : "neg";
      return `
        <div class="watchlistCard" data-watchlist-sym="${escapeHtml(item.sym)}">
          <div class="watchlistCardHead">
            <div class="watchlistCardSym">${escapeHtml(item.sym)}</div>
            <div class="watchlistCardName muted small">${escapeHtml(item.name || item.sym)}</div>
          </div>
          <div class="watchlistCardPrice">$${escapeHtml(String(item.price || "—"))}</div>
          <div class="watchlistCardChange num ${chCls}">${ch >= 0 ? "+" : ""}${escapeHtml(String(item.change24h ?? "—"))}%</div>
          <div class="watchlistCardPills">
            <span class="pillSent ${sentCls}">${escapeHtml(sent)}</span>
            <span class="pillRisk ${riskCls}">${escapeHtml(risk)}</span>
          </div>
          <div class="watchlistCardActions">
            <button type="button" class="btnMini watchlistCompareBtn" data-watchlist-sym="${escapeHtml(item.sym)}">Compare →</button>
            <button type="button" class="btnMiniGhost watchlistRemoveBtn" data-watchlist-sym="${escapeHtml(item.sym)}">Remove</button>
          </div>
        </div>
      `;
    })
    .join("");

  return `
      <div class="bg">
        ${TopNav(state)}
        <div class="wrap">
          <div class="pageHdr">
            <div>
              <div class="kicker">My Watchlist</div>
              <div class="muted">Track your assets. Updated live.</div>
            </div>
          </div>

          <div class="watchlistAddRow">
            <input class="input watchlistAddInput" id="watchlistAddInput" type="text" placeholder="Add coin e.g. BTC, ETH, SOL" />
            <button type="button" class="btnMini" id="watchlistAddBtn">Add</button>
          </div>
          <div class="muted small" id="watchlistAddError" style="margin-top:6px; min-height:20px;"></div>

          ${
            empty
              ? `
          <div class="watchlistEmpty">
            <div class="watchlistEmptyTitle">No assets yet. Add coins from the compare page.</div>
            <button type="button" class="btnInline" id="watchlistEmptyCompareBtn">Run a compare →</button>
          </div>`
              : `
          <div class="watchlistGrid" id="watchlistGrid">
            ${cardGrid}
          </div>`
          }
        </div>
      </div>
    `;
}

/* ---------- Learn / Courses page ---------- */

function learnCourseCard(num, title, desc, bullets, price) {
  return `
    <div class="learn-course-card">
      <div class="learn-course-num">${num}</div>
      <div class="learn-course-title">${escapeHtml(title)}</div>
      <div class="learn-course-desc muted">${escapeHtml(desc)}</div>
      <ul class="learn-course-bullets">
        ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>
      <div class="learn-course-price">${escapeHtml(price)}</div>
      <button class="cta btnFull learn-enroll-btn" data-course="${escapeHtml(title)}">Enroll Now</button>
    </div>
  `;
}

function LearnEnrollModal() {
  return `
    <div class="modalBackdrop" id="learnEnrollModal">
      <div class="modal">
        <div class="modalTop">
          <div>
            <div class="modalTitle">Payment coming soon</div>
            <div class="muted" style="margin-top:4px;">Drop your email to be notified when enrollment opens.</div>
          </div>
          <button class="x" id="closeLearnEnrollModal" aria-label="Close">✕</button>
        </div>
        <input type="hidden" id="learnEnrollCourseName" value="" />
        <div class="searchRow" style="margin-top:16px;">
          <input class="input" id="learnEnrollEmail" placeholder="you@domain.com" type="email" />
          <button class="cta" id="learnEnrollSubmitBtn">Notify me</button>
        </div>
        <div class="muted small" id="learnEnrollStatus" style="margin-top:12px;min-height:18px;"></div>
      </div>
    </div>
  `;
}

function LearnPage(state) {
  return `
    <div class="bg">
      ${TopNav(state)}
      <div class="wrap">

        <div class="learn-hero">
          <div class="learn-hero-glow" aria-hidden="true"></div>
          <div class="heroProof">
            <span class="heroPill learn-gold-pill">4 Courses Available</span>
            <span class="heroPill learn-gold-pill">Lifetime Access</span>
          </div>
          <h1 class="learn-hero-headline">Master Crypto. Build Real Conviction.</h1>
          <p class="learn-hero-sub">Structured courses for investors who want to understand the market — not just follow it.</p>
        </div>

        <div id="learnCourseGrid" class="learn-course-grid">
          ${learnCourseCard("01", "Crypto Fundamentals", "Everything you need to go from zero to confident.", ["How blockchain works", "Bitcoin vs altcoins explained", "How to read a crypto market"], "$49")}
          ${learnCourseCard("02", "Reading the Market", "Learn to interpret price action without the noise.", ["Candlestick patterns & volume", "Support, resistance & trend lines", "When to buy, hold, or exit"], "$79")}
          ${learnCourseCard("03", "Portfolio Strategy", "Build a portfolio designed to survive volatility.", ["Allocation frameworks for crypto", "Risk management principles", "Rebalancing and position sizing"], "$79")}
          ${learnCourseCard("04", "DeFi & Beyond", "Understand the next layer of crypto before everyone else does.", ["How DeFi protocols work", "Yield, liquidity, and risk", "Wallets, bridges, and staying safe"], "$99")}
        </div>

        <div class="learn-how">
          <h2 class="learn-section-title">How It Works</h2>
          <div class="learn-steps">
            <div class="learn-step">
              <div class="learn-step-num">01</div>
              <div class="learn-step-label">Purchase</div>
              <div class="learn-step-desc muted">Choose your course and complete checkout securely via Stripe.</div>
            </div>
            <div class="learn-step">
              <div class="learn-step-num">02</div>
              <div class="learn-step-label">Access</div>
              <div class="learn-step-desc muted">Get instant lifetime access to all course materials.</div>
            </div>
            <div class="learn-step">
              <div class="learn-step-num">03</div>
              <div class="learn-step-label">Learn</div>
              <div class="learn-step-desc muted">Work through structured lessons at your own pace.</div>
            </div>
          </div>
        </div>

        <div class="learn-instructor">
          <div class="learn-instructor-avatar">CC</div>
          <div class="learn-instructor-body">
            <h2 class="learn-section-title" style="margin-top:0;">Built by a crypto investor, for crypto investors.</h2>
            <p class="muted" style="margin:10px 0 0; line-height:1.7;">These courses were built from years of navigating real markets — not theory. Every lesson is designed to give you practical frameworks you can apply immediately.</p>
          </div>
        </div>

        <div class="learn-faq">
          <h2 class="learn-section-title">Frequently Asked Questions</h2>
          <div class="learn-faq-list">
            <div class="learn-faq-item">
              <button class="learn-faq-q" aria-expanded="false">
                <span>Do I get lifetime access?</span>
                <span class="learn-faq-chevron">▼</span>
              </button>
              <div class="learn-faq-a">Yes. Once you purchase a course, you have permanent access including all future updates.</div>
            </div>
            <div class="learn-faq-item">
              <button class="learn-faq-q" aria-expanded="false">
                <span>What if I'm a complete beginner?</span>
                <span class="learn-faq-chevron">▼</span>
              </button>
              <div class="learn-faq-a">Crypto Fundamentals is built specifically for beginners. No prior knowledge needed.</div>
            </div>
            <div class="learn-faq-item">
              <button class="learn-faq-q" aria-expanded="false">
                <span>Is there a bundle option?</span>
                <span class="learn-faq-chevron">▼</span>
              </button>
              <div class="learn-faq-a">A full bundle at a discounted rate is coming soon. Drop your email on any course to be notified.</div>
            </div>
          </div>
        </div>

        <div class="learn-footer-cta">
          <h2 class="learn-footer-cta-headline">Ready to invest in your knowledge?</h2>
          <p class="learn-footer-cta-sub">Join hundreds of investors learning to navigate crypto with confidence.</p>
          <button class="cta learn-footer-cta-btn" id="learnScrollToCoursesBtn">Browse Courses</button>
        </div>

      </div>
    </div>
    ${LearnEnrollModal()}
  `;
}

/* ==========================================================
   SPANISH (ES) PAGES — Versión en Español
   Same structure + IDs as English pages; UI text translated
   for a Latin American crypto audience.
   ========================================================== */

function EsTopNav(state) {
  const isEs = (r) => (state.route === `es-${r}` || (r === "compare" && state.route === "es") ? "active" : "");
  const authed = !!state.user;
  const userEmail = authed ? (state.user.email || "Sesión iniciada") : "";
  const trialActive = state.trialUntil && state.trialUntil > Date.now();
  const trialDaysLeft = trialActive
    ? Math.max(1, Math.ceil((state.trialUntil - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const trialPill = trialActive
    ? `<span class="trialNavPill">Trial: ${trialDaysLeft} día${trialDaysLeft > 1 ? "s" : ""}</span>`
    : "";
  const points = (state.lifetimeCompares || 0) * 10;

  const trialButtonHtml = trialActive
    ? `<button class="accountItem highlight" id="acctTrialBtn" role="menuitem">
        <div>
          <div class="accountItemTitle">Tu trial Premium ›</div>
          <div class="muted small">Comparaciones ilimitadas y señales</div>
        </div>
        <span class="trialActivePill">Activo</span>
      </button>`
    : `<button class="accountItem highlight" id="acctTrialBtn" role="menuitem">
        <div>
          <div class="accountItemTitle">Trial gratuito de 3 días</div>
          <div class="muted small">Oferta limitada para usuarios activos</div>
        </div>
        <span class="pillLite">Nuevo</span>
      </button>`;

  return `
    <div class="navWrap">
      <div class="nav">
        <a href="#es-compare" class="brand brandLink">
          <img src="/compareclearlogo.png" alt="CompareCrypto.ai" style="height:36px; width:auto; display:block;" onerror="this.style.display='none'; var t=this.nextElementSibling; if(t) t.style.display='inline';" />
          <span class="brandText">CompareCrypto.ai</span>
        </a>

        <div class="links">
          <a class="${isEs("compare")}" href="#es-compare">Comparar</a>
          <a class="${isEs("dashboard")}" href="#es-dashboard">Panel</a>
          <a class="${isEs("pricing")}" href="#es-pricing">Precios</a>
        </div>

        <div class="navRight">
          <a href="#compare" id="langToggleBtn" class="langToggleBtn" title="Switch to English">🇺🇸 EN</a>
          <button type="button" class="navHamburgerBtn" id="navHamburgerBtn" aria-label="Abrir menú" aria-expanded="false">☰</button>
          ${trialPill}
          ${authed
            ? `<button class="accountBtn" id="accountBtn" aria-haspopup="menu" aria-expanded="false">
                <div class="accountBtnInner">
                  <span class="accountEmail">${escapeHtml(userEmail)}</span>
                  <span class="accountPoints">${points} puntos</span>
                </div>
                <span class="accountDots" aria-hidden="true">⋯</span>
              </button>
              <div class="accountMenu" id="accountMenu" role="menu" aria-label="Menú de cuenta">
                <div class="accountMenuTop">
                  <div class="accountMenuLabel">Sesión iniciada como</div>
                  <div class="accountMenuEmail">${escapeHtml(userEmail)}</div>
                </div>
                <div class="accountMenuItems">
                  <button class="accountItem" id="acctProfileBtn" role="menuitem">
                    <span>Cuenta / Perfil</span>
                    <span class="muted small">›</span>
                  </button>
                  <button class="accountItem" id="acctWatchlistBtn" role="menuitem">
                    <span>📋 Mi lista de seguimiento</span>
                    <span class="muted small">›</span>
                  </button>
                  ${trialButtonHtml}
                  <button class="accountItem" id="acctOffersBtn" role="menuitem">
                    <span>Ofertas</span>
                    <span class="muted small">›</span>
                  </button>
                  <div class="accountDivider"></div>
                  <button class="accountItem danger" id="logoutBtn" role="menuitem">Cerrar sesión</button>
                </div>
              </div>`
            : `<button class="ghost" id="loginBtn">Iniciar sesión</button>
               <button class="cta" id="getStartedBtn">Comenzar</button>`
          }
        </div>
      </div>
      <div class="navMobileMenu" id="navMobileMenu" aria-hidden="true">
        <a class="${isEs("compare")}" href="#es-compare">Comparar</a>
        <a class="${isEs("dashboard")}" href="#es-dashboard">Panel</a>
        <a class="${isEs("pricing")}" href="#es-pricing">Precios</a>
      </div>
    </div>
  `;
}

/* ---------- ES Compare page ---------- */

function EsComparePage(state) {
  const mode = state.mode || "assets";
  const usage = state.usage || { used: 0, freeLimit: 3 };
  const used = usage.used ?? 0;
  const limit = usage.freeLimit ?? 3;
  const bumped = !!state.usageBumped;
  const premiumActive = !!(state.trialUntil && state.trialUntil > Date.now());

  const modeLabel =
    mode === "assets"
      ? "Modo activos: clasifica monedas por momentum y convicción."
      : "Modo exchanges: encuentra el mejor lugar para ejecutar.";

  const modeRow = `
    <div class="modeRow">
      <div>
        <div class="segmented">
          <button class="seg ${mode === "assets" ? "active" : ""}" id="modeAssets">Activos</button>
          <button class="seg ${mode === "exchanges" ? "active" : ""}" id="modeExchanges">Exchanges</button>
        </div>
        <div class="muted small" style="margin-top:4px;">${modeLabel}</div>
      </div>
      <div class="sponsorSlotWrap">
        <button class="sponsorSlot" id="sponsorSlotBtn" title="Espacios patrocinados disponibles pronto">
          Patrocinado por Binance
        </button>
      </div>
      <div class="usageLine">
        <div class="usagePill ${bumped ? "usagePulse" : ""}">
          <span class="muted">Comparaciones gratuitas diarias</span>
          <span class="usageCount"><b>${used}</b>/<b>${limit}</b></span>
        </div>
      </div>
      <div class="usageInline" id="usageInline"></div>
    </div>
  `;

  const chips =
    mode === "assets"
      ? ["BTC", "ETH", "SOL", "ADA", "DOGE", "XRP", "AVAX", "LINK", "PEPE", "BONK"]
      : ["Coinbase", "Kraken", "Binance", "Bybit", "OKX", "Bitstamp", "KuCoin", "Gemini", "Gate.io", "MEXC"];

  const placeholder =
    mode === "assets"
      ? "Busca cualquier moneda (ej. BTC, ETH, SOL, XRP, AVAX, LINK, PEPE, BONK)…"
      : "Escribe una moneda (BTC, ETH, SOL) O nombres de exchange (Binance, Coinbase)…";

  const sourcePill = `
    <div class="sponsorPill">
      <span class="muted">Socio de mercado</span>
      <span class="dotSep">•</span>
      <span class="logoPill logoPillImg">
        <img src="/binance-logo.svg" alt="Binance" />
      </span>
    </div>
  `;

  return `
    <div class="bg">
      ${EsTopNav(state)}
      <div class="wrap">
        <div class="hero">
          <h1 class="headline">
            Compara <span class="grad">CUALQUIER cripto</span>.
          </h1>
          <p class="sub">
            Precios, momentum y mejores rutas de exchange en una pantalla.
          </p>
          <div class="heroProof">
            <span class="heroPill">Precios en vivo</span>
            <span class="heroPill">Momentum 24h + 7d</span>
            <span class="heroPill">Mejor cotización en exchanges</span>
            <span class="heroPill">Calificaciones de la comunidad</span>
          </div>
          ${modeRow}
        </div>

        <div class="compareCard${premiumActive ? " compareCardPremium" : ""}">
          ${state.reopenContext ? ReopenWorkspacePanel(state) : ""}
          ${premiumActive ? '<div class="compareCardPremiumBadge">Premium</div>' : ""}

          ${premiumActive
            ? `<div class="guideRow guideRowCollapsed"><span class="muted small">Selecciona activos o exchanges y luego Comparar.</span></div>`
            : `<div class="guideRow">
              <div class="guideStep">
                <span class="guideNum">1</span>
                <span>${mode === "assets" ? "Elige 2+ activos" : "Escribe un token o exchange"}</span>
              </div>
              <div class="guideStep">
                <span class="guideNum">2</span>
                <span>${mode === "assets" ? "Haz clic en Comparar ahora" : "Selecciona exchanges a comparar"}</span>
              </div>
              <div class="guideStep">
                <span class="guideNum">3</span>
                <span>Actúa sobre la mejor configuración</span>
              </div>
            </div>`
          }

          <div class="rewardToast" id="rewardToast"></div>

          ${premiumActive ? '<div class="premiumStatusBar">✦ Premium activo — comparaciones ilimitadas, señales completas desbloqueadas</div>' : ""}

          <div class="searchRow${premiumActive ? " searchRowPremium" : ""}">
            <input class="input${premiumActive ? " inputPremium" : ""}" id="search" placeholder="${placeholder}" />
            <button class="cta" id="compareBtn">Comparar ahora</button>
            <button class="btnAlt" id="saveBtn">Guardar vista</button>
          </div>

          <div class="chips" id="chips">
            ${chips.map((c) => `<button class="chip" data-chip="${c}">+ ${mode === "assets" ? "🪙" : "🏦"} ${c}</button>`).join("")}
          </div>

          <div class="chips" id="presets" style="margin-top:10px;">
            ${mode === "assets"
              ? `<button class="chip" data-preset="majors">Principales: BTC ETH SOL</button>
                 <button class="chip" data-preset="layer1">Cesta Layer 1</button>
                 <button class="chip" data-preset="payments">Pagos: XRP XLM LTC</button>`
              : `<button class="chip" data-preset="tier1">Exchanges Tier-1</button>
                 <button class="chip" data-preset="alts">Exchanges para altcoins</button>
                 <button class="chip" data-preset="global">Mix global</button>`
            }
          </div>

          <div class="selectedRow">
            <div class="selectedList" id="selectedList"></div>
          </div>

          <div class="results" id="results">
            <div class="resultLine ok">
              <div class="resultTop">
                <div class="resultTitle"></div>
                <span id="dataSourceIndicator" class="dataSourceIndicator" aria-hidden="true"></span>
                ${sourcePill}
              </div>
            </div>
            <div id="resultBody"></div>
            <div id="learnPanel"></div>
          </div>

          <div id="editorialStrip"></div>
          <div class="savedBlock" id="savedBlock"></div>
        </div>
      </div>

      ${EsLimitModal()}
      ${EsInsightsModal()}
      ${EsExchangeInsightModal()}
    </div>
  `;
}

/* ---------- ES Dashboard ---------- */

function EsDashboardPage(state) {
  const views = state.savedViews || [];

  return `
    <div class="bg">
      ${EsTopNav(state)}
      <div class="wrap">
        <div class="pageHdr pageHdrDash">
          <div class="pageActions pageActionsLeft">
            <button class="btnAlt btnWithIcon" id="dashCompareBtn"><span aria-hidden="true">⚡</span><span>Hacer una comparación</span></button>
            <button class="btn btnWithIcon" id="goPremiumBtn"><span aria-hidden="true">👑</span><span>Activar Premium</span></button>
          </div>
        </div>

        <div class="dashStory">
          <div class="dashStoryTop">
            <div class="dashStoryTitle">¿Por qué comparar cripto antes de actuar?</div>
            <div class="muted small">Esta herramienta te ayuda a tomar decisiones más rápidas y acertadas con menos incertidumbre.</div>
          </div>
          <div class="dashStoryGrid">
            <div class="dashStoryCard">
              <div class="dashStoryK">Elige activos más fuertes</div>
              <div class="muted small">Compara el momentum de 24h y 7d lado a lado para evitar perseguir movimientos aleatorios.</div>
            </div>
            <div class="dashStoryCard">
              <div class="dashStoryK">Obtén mejor ejecución</div>
              <div class="muted small">Escanea diferencias de precio entre exchanges para que tus compras y ventas ocurran en mejores plataformas.</div>
            </div>
            <div class="dashStoryCard">
              <div class="dashStoryK">Ventaja del sentimiento comunitario</div>
              <div class="muted small">Combina la convicción colectiva con el momentum para detectar configuraciones de mayor confianza antes.</div>
            </div>
          </div>
          <div class="dashStoryCtas">
            <button class="btnMini" id="dashHowBtn">Cómo usar esto en 60s</button>
            ${state.user
              ? `<button class="btnMiniGhost btnWithIcon" id="dashEmailInsightBtn"><span aria-hidden="true">📩</span><span>Recibir análisis semanal por email</span></button>`
              : `<button class="btnMiniGhost" id="dashSignupBtn">Crear cuenta gratuita</button>`
            }
          </div>
        </div>

        <div class="marketWindow" id="marketWindow">
          <div class="marketWindowHead">
            <div class="dashStoryTitle" style="font-size:18px;">Pulso del mercado</div>
            <div class="marketModes">
              <button class="marketModeBtn active" id="pulseMarketBtn">Mercados</button>
              <button class="marketModeBtn" id="pulseCommunityBtn">Sentimiento comunitario</button>
            </div>
          </div>
          <div class="muted small" id="marketPulseNote" style="margin-top:6px;"></div>
          <div class="marketGrid" id="marketGrid"></div>
        </div>

        ${DashboardIntelStrip()}

        <div class="savedHdr">
          <div>
            <div class="savedTitle">Comparaciones guardadas</div>
            <div class="muted small">Abre cualquier configuración guardada y actualízala con datos del mercado en vivo.</div>
          </div>
          <div class="savedBtns">
            <button class="btnAlt" id="clearSavedBtn">Borrar guardadas</button>
          </div>
        </div>

        <div class="dashGrid">
          ${views.length ? views.map(EsViewCard).join("") : EsEmptyDash()}
        </div>
      </div>
    </div>
  `;
}

/* ---------- ES Account page ---------- */

function EsAccountPage(state) {
  const email = state.user?.email || "";
  const points = (state.lifetimeCompares || 0) * 10;

  return `
    <div class="bg">
      ${EsTopNav(state)}
      <div class="wrap">
        <div class="pageHdr">
          <div>
            <div class="kicker">Cuenta y seguridad</div>
            <div class="muted">Administra tu inicio de sesión, contraseña y próximas facturaciones en un solo lugar.</div>
          </div>
        </div>

        <div class="grid2" style="margin-top:14px;">
          <div class="plan">
            <div class="planTitle">Perfil</div>
            <div class="muted small" style="margin-top:4px;">Email utilizado para iniciar sesión</div>
            <div style="margin-top:6px; font-weight:800;">${escapeHtml(email)}</div>
            <div class="noteBox" style="margin-top:14px;">
              <div class="muted small">Puntos</div>
              <div style="margin-top:4px; font-weight:800;">${points} puntos</div>
              <div class="muted small" style="margin-top:4px;">Ganados por comparaciones realizadas.</div>
            </div>
          </div>

          <div class="plan">
            <div class="planTitle">Contraseña y seguridad</div>
            <div class="insList" style="padding:8px 0 0;">
              <div class="bullet">
                <div class="muted small">Cambiar contraseña (sesión activa)</div>
                <input class="input" id="newPasswordInput" type="password" placeholder="Nueva contraseña (mín. 8 chars)" style="margin-top:6px;" />
                <button class="btnMini" id="changePasswordBtn" style="margin-top:8px;">Actualizar contraseña</button>
              </div>
              <div class="bullet" style="margin-top:8px;">
                <div class="muted small">¿Olvidaste tu contraseña?</div>
                <div class="muted small" style="margin-top:4px;">Podemos enviarte un enlace de restablecimiento a ${escapeHtml(email) || "tu email"}.</div>
                <button class="btnMiniGhost" id="sendResetLinkBtn" style="margin-top:8px;">Enviarme un enlace de restablecimiento</button>
              </div>
              <div class="muted small" id="accountStatus" style="margin-top:10px;"></div>
            </div>
          </div>
        </div>

        <div class="grid2" style="margin-top:14px;">
          ${EsBillingCard(state)}
          ${EsReferralCard(state)}
        </div>
      </div>
    </div>
  `;
}

function EsBillingCard(state) {
  const now = Date.now();
  const trialUntil = state.trialUntil;
  const trialActive = trialUntil && trialUntil > now;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const premiumPaying = trialActive && (trialUntil - now) > thirtyDaysMs;

  if (premiumPaying) {
    const planLabel = state.billingPlan === "yearly" ? "Anual" : state.billingPlan === "monthly" ? "Mensual" : "";
    const planLine = planLabel ? ` (${planLabel})` : "";
    return `
      <div class="plan billingCard">
        <div class="planTitle">Facturación</div>
        <div class="billingHeadline">Estás en Premium ✦</div>
        <div class="muted small" style="margin-top:6px;">Comparaciones ilimitadas, señales completas, todas las funciones desbloqueadas${planLine}</div>
        <button class="btnFull" id="billingManageBtn" style="margin-top:14px;">Administrar facturación →</button>
      </div>`;
  }

  if (trialActive) {
    const countdownShort = `Vence en ${formatTrialCountdownShort(trialUntil)}`;
    return `
      <div class="plan billingCard billingCardTrial">
        <div class="planTitle">Facturación</div>
        <div class="billingHeadline">Estás en Trial Premium</div>
        <div class="billingCountdown" id="billingCountdown">${escapeHtml(countdownShort)}</div>
        <div class="billingUrgency">Asegura tu tarifa antes de que termine tu trial</div>
        <button class="cta btnFull" id="billingUpgradeNowBtn" style="margin-top:14px;">Actualizar ahora — desde $20/mes →</button>
        <div class="muted small" style="margin-top:10px;">
          <a href="#" id="billingYearlyLink">Ver plan anual (ahorra 17%)</a>
        </div>
      </div>`;
  }

  return `
    <div class="plan billingCard">
      <div class="planTitle">Facturación</div>
      <div class="billingHeadline">Estás en el plan gratuito</div>
      <div class="muted small" style="margin-top:6px;">3 comparaciones gratis por día. Sin señales. Sin predicciones.</div>
      <button class="cta btnFull" id="billingUnlockPremiumBtn" style="margin-top:14px;">Activar Premium →</button>
      <div class="muted small" style="margin-top:10px;">
        <a href="#" id="billingTrialLink">O inicia un trial gratuito de 3 días</a>
      </div>
    </div>`;
}

function EsReferralCard(state) {
  const referralCode = state.referralCode || "------";
  const refCount = state.referralCount ?? 0;
  const baseUrl = "https://comparecrypto.ai";
  const refLink = `${baseUrl}?ref=${referralCode}`;
  const emailSubject = "Estoy usando CompareCrypto.ai — deberías probarlo";
  const emailBody = `Hola, estoy usando CompareCrypto.ai para comparar criptoactivos y tasas de exchange. Usa mi enlace de referido para obtener 3 días de Premium gratis: ${refLink}`;
  const tweetText = encodeURIComponent(`Encontré @CompareCryptoAI — la mejor forma de comparar criptoactivos y tasas de exchange. Obtén 3 días Premium gratis con mi enlace: ${refLink}`);

  return `
    <div class="plan referralCard">
      <div class="referralHeadline">Refiere y gana — da 3 días, recibe 3 días</div>
      <button type="button" class="referralRevealTeaser" id="referralRevealBtn">
        <span class="referralRevealTeaserText">Revelar tu código de referido</span>
        <span class="referralRevealChevron" aria-hidden="true">▼</span>
      </button>
      <div id="referralRevealContent" class="referralRevealContent">
        <div class="muted small" style="margin-top:14px;">Tu código de referido</div>
        <div class="referralCodeBlock" id="referralCodeDisplay">${escapeHtml(referralCode)}</div>
        <div class="muted small" style="margin-top:10px;">Comparte tu enlace:</div>
        <div class="referralShareRow">
          <button type="button" class="referralShareBtn" id="referralCopyBtn" title="Copiar enlace">📋 Copiar enlace</button>
          <a href="mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}" class="referralShareBtn referralShareLink" title="Compartir por email">✉️ Email</a>
          <a href="https://twitter.com/intent/tweet?text=${tweetText}" target="_blank" rel="noopener noreferrer" class="referralShareBtn referralShareLink" title="Compartir en X">𝕏 Compartir</a>
        </div>
        <div id="referralCountLine" class="referralCountLine muted small">Has referido ${refCount} amigo${refCount !== 1 ? "s" : ""} — ${refCount} × 3 días ganados</div>
      </div>
    </div>`;
}

/* ---------- ES Pricing page ---------- */

function EsPricingPage(state) {
  const trialActive = state.trialUntil && state.trialUntil > Date.now();
  const trialDaysLeft = trialActive
    ? Math.max(1, Math.ceil((state.trialUntil - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const trialBanner = trialActive
    ? `<div class="trialBanner">Estás en un trial Premium de 3 días. Disfruta comparaciones ilimitadas y señales durante los próximos ${trialDaysLeft} día${trialDaysLeft > 1 ? "s" : ""}.</div>`
    : "";

  return `
    <div class="bg">
      ${EsTopNav(state)}
      <div class="wrap">
        <div class="pricingHero">
          <div class="kicker jumbo">Activa tu ventaja Premium</div>
          <div class="muted">Deja de esperar. Obtén comparaciones ilimitadas, alertas de arbitraje y dashboards guardados — para actuar cuando el mercado se mueva.</div>
          ${trialBanner}
        </div>

        <div class="grid2">
          <div class="plan">
            <div class="planTitle">Mensual</div>
            <div class="price">$20<span>/mes</span></div>
            <ul>
              <li><b>Comparaciones ilimitadas</b> — sin límite diario</li>
              <li>Vistas guardadas + dashboards</li>
              <li>Alertas de arbitraje cuando los spreads suben</li>
              <li>Overlays de predicción comunitaria</li>
            </ul>
            <button class="btnFull" id="checkoutMonthly">Continuar al pago</button>
          </div>

          <div class="plan glow">
            <div class="save">MEJOR VALOR — AHORRA $40</div>
            <div class="planTitle">Anual</div>
            <div class="price">$200<span>/año</span></div>
            <div class="muted small">($16.67/mes — 2 meses gratis)</div>
            <ul>
              <li>Todo lo del plan mensual</li>
              <li>Acceso prioritario a nuevas funciones</li>
              <li><b>Acceso al Bot de Trading con IA (beta)</b></li>
              <li>Ofertas de socios + descuentos en comisiones</li>
            </ul>
            <button class="cta btnFull" id="checkoutYearly">Continuar al pago</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- ES Waitlist page ---------- */

function EsWaitlistPage(state) {
  const prefill = state.user?.email || "";
  return `
    <div class="bg">
      ${EsTopNav(state)}
      <div class="wrap">
        <div class="pricingHero">
          <div class="kicker jumbo">Lista de acceso al pago</div>
          <div class="muted">Déjanos tu email y te enviaremos el enlace de pago en cuanto esté disponible.</div>
        </div>

        <div class="compareCard">
          <div class="hint">El producto de comparación ya está disponible. Este formulario es solo para el aviso de lanzamiento de pago.</div>

          <div class="searchRow">
            <input class="input" id="waitlistEmail" placeholder="tú@dominio.com" value="${escapeHtml(prefill)}" />
            <button class="btn" id="joinWaitlistBtn">Unirme a la lista</button>
          </div>

          <div class="muted small" id="waitlistStatus" style="margin-top:12px;"></div>

          <div class="noteBox" style="margin-top:14px;">
            <div class="muted">
              Premium incluye comparaciones ilimitadas, dashboards guardados e información más profunda sobre exchanges.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- ES Watchlist page ---------- */

function EsWatchlistPage(state) {
  const list = state.watchlist || [];
  const empty = list.length === 0;

  const cardGrid = list.map((item) => {
    const sent = String(item.sentiment || "Neutral");
    const sentCls = watchlistSentClass(sent);
    const risk = String(item.risk || "Medium");
    const riskCls = watchlistRiskClass(risk);
    const ch = Number(item.change24h || 0);
    const chCls = ch >= 0 ? "pos" : "neg";
    return `
      <div class="watchlistCard" data-watchlist-sym="${escapeHtml(item.sym)}">
        <div class="watchlistCardHead">
          <div class="watchlistCardSym">${escapeHtml(item.sym)}</div>
          <div class="watchlistCardName muted small">${escapeHtml(item.name || item.sym)}</div>
        </div>
        <div class="watchlistCardPrice">$${escapeHtml(String(item.price || "—"))}</div>
        <div class="watchlistCardChange num ${chCls}">${ch >= 0 ? "+" : ""}${escapeHtml(String(item.change24h ?? "—"))}%</div>
        <div class="watchlistCardPills">
          <span class="pillSent ${sentCls}">${escapeHtml(sent)}</span>
          <span class="pillRisk ${riskCls}">${escapeHtml(risk)}</span>
        </div>
        <div class="watchlistCardActions">
          <button type="button" class="btnMini watchlistCompareBtn" data-watchlist-sym="${escapeHtml(item.sym)}">Comparar →</button>
          <button type="button" class="btnMiniGhost watchlistRemoveBtn" data-watchlist-sym="${escapeHtml(item.sym)}">Eliminar</button>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="bg">
      ${EsTopNav(state)}
      <div class="wrap">
        <div class="pageHdr">
          <div>
            <div class="kicker">Mi lista de seguimiento</div>
            <div class="muted">Sigue tus activos. Actualizado en tiempo real.</div>
          </div>
        </div>

        <div class="watchlistAddRow">
          <input class="input watchlistAddInput" id="watchlistAddInput" type="text" placeholder="Agregar moneda ej. BTC, ETH, SOL" />
          <button type="button" class="btnMini" id="watchlistAddBtn">Agregar</button>
        </div>
        <div class="muted small" id="watchlistAddError" style="margin-top:6px; min-height:20px;"></div>

        ${empty
          ? `<div class="watchlistEmpty">
              <div class="watchlistEmptyTitle">Sin activos aún. Agrega monedas desde la página de comparación.</div>
              <button type="button" class="btnInline" id="watchlistEmptyCompareBtn">Hacer una comparación →</button>
            </div>`
          : `<div class="watchlistGrid" id="watchlistGrid">${cardGrid}</div>`
        }
      </div>
    </div>
  `;
}

/* ---------- ES Learn / Courses page ---------- */

function esLearnCourseCard(num, title, desc, bullets, price) {
  return `
    <div class="learn-course-card">
      <div class="learn-course-num">${num}</div>
      <div class="learn-course-title">${escapeHtml(title)}</div>
      <div class="learn-course-desc muted">${escapeHtml(desc)}</div>
      <ul class="learn-course-bullets">
        ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>
      <div class="learn-course-price">${escapeHtml(price)}</div>
      <button class="cta btnFull learn-enroll-btn" data-course="${escapeHtml(title)}">Inscribirme ahora</button>
    </div>
  `;
}

function EsLearnEnrollModal() {
  return `
    <div class="modalBackdrop" id="learnEnrollModal">
      <div class="modal">
        <div class="modalTop">
          <div>
            <div class="modalTitle">Pago próximamente</div>
            <div class="muted" style="margin-top:4px;">Déjanos tu email para que te avisemos cuando la inscripción esté disponible.</div>
          </div>
          <button class="x" id="closeLearnEnrollModal" aria-label="Cerrar">✕</button>
        </div>
        <input type="hidden" id="learnEnrollCourseName" value="" />
        <div class="searchRow" style="margin-top:16px;">
          <input class="input" id="learnEnrollEmail" placeholder="tú@dominio.com" type="email" />
          <button class="cta" id="learnEnrollSubmitBtn">Notificarme</button>
        </div>
        <div class="muted small" id="learnEnrollStatus" style="margin-top:12px;min-height:18px;"></div>
      </div>
    </div>
  `;
}

function EsLearnPage(state) {
  return `
    <div class="bg">
      ${EsTopNav(state)}
      <div class="wrap">

        <div class="learn-hero">
          <div class="learn-hero-glow" aria-hidden="true"></div>
          <div class="heroProof">
            <span class="heroPill learn-gold-pill">4 Cursos disponibles</span>
            <span class="heroPill learn-gold-pill">Acceso de por vida</span>
          </div>
          <h1 class="learn-hero-headline">Domina el cripto. Construye convicción real.</h1>
          <p class="learn-hero-sub">Cursos estructurados para inversores que quieren entender el mercado — no solo seguirlo.</p>
        </div>

        <div id="learnCourseGrid" class="learn-course-grid">
          ${esLearnCourseCard("01", "Fundamentos del cripto", "Todo lo que necesitas para pasar de cero a confiado.", ["Cómo funciona la blockchain", "Bitcoin vs altcoins explicado", "Cómo leer el mercado cripto"], "$49")}
          ${esLearnCourseCard("02", "Leyendo el mercado", "Aprende a interpretar la acción del precio sin el ruido.", ["Velas japonesas y volumen", "Soporte, resistencia y tendencias", "Cuándo comprar, mantener o salir"], "$79")}
          ${esLearnCourseCard("03", "Estrategia de portafolio", "Construye un portafolio diseñado para sobrevivir la volatilidad.", ["Marcos de asignación para cripto", "Principios de gestión del riesgo", "Rebalanceo y dimensionamiento de posiciones"], "$79")}
          ${esLearnCourseCard("04", "DeFi y más allá", "Comprende la siguiente capa del cripto antes que todos.", ["Cómo funcionan los protocolos DeFi", "Yield, liquidez y riesgo", "Wallets, bridges y cómo mantenerte seguro"], "$99")}
        </div>

        <div class="learn-how">
          <h2 class="learn-section-title">¿Cómo funciona?</h2>
          <div class="learn-steps">
            <div class="learn-step">
              <div class="learn-step-num">01</div>
              <div class="learn-step-label">Compra</div>
              <div class="learn-step-desc muted">Elige tu curso y completa el pago de forma segura via Stripe.</div>
            </div>
            <div class="learn-step">
              <div class="learn-step-num">02</div>
              <div class="learn-step-label">Accede</div>
              <div class="learn-step-desc muted">Obtén acceso de por vida instantáneo a todos los materiales del curso.</div>
            </div>
            <div class="learn-step">
              <div class="learn-step-num">03</div>
              <div class="learn-step-label">Aprende</div>
              <div class="learn-step-desc muted">Avanza por las lecciones estructuradas a tu propio ritmo.</div>
            </div>
          </div>
        </div>

        <div class="learn-instructor">
          <div class="learn-instructor-avatar">CC</div>
          <div class="learn-instructor-body">
            <h2 class="learn-section-title" style="margin-top:0;">Creado por un inversor cripto, para inversores cripto.</h2>
            <p class="muted" style="margin:10px 0 0; line-height:1.7;">Estos cursos fueron creados a partir de años navegando mercados reales — no teoría. Cada lección está diseñada para darte marcos prácticos que puedes aplicar de inmediato.</p>
          </div>
        </div>

        <div class="learn-faq">
          <h2 class="learn-section-title">Preguntas frecuentes</h2>
          <div class="learn-faq-list">
            <div class="learn-faq-item">
              <button class="learn-faq-q" aria-expanded="false">
                <span>¿Tengo acceso de por vida?</span>
                <span class="learn-faq-chevron">▼</span>
              </button>
              <div class="learn-faq-a">Sí. Una vez que compras un curso, tienes acceso permanente incluyendo todas las actualizaciones futuras.</div>
            </div>
            <div class="learn-faq-item">
              <button class="learn-faq-q" aria-expanded="false">
                <span>¿Qué pasa si soy un completo principiante?</span>
                <span class="learn-faq-chevron">▼</span>
              </button>
              <div class="learn-faq-a">Fundamentos del cripto está creado específicamente para principiantes. No se necesita conocimiento previo.</div>
            </div>
            <div class="learn-faq-item">
              <button class="learn-faq-q" aria-expanded="false">
                <span>¿Hay una opción de bundle?</span>
                <span class="learn-faq-chevron">▼</span>
              </button>
              <div class="learn-faq-a">Un bundle completo con descuento estará disponible pronto. Deja tu email en cualquier curso para que te avisemos.</div>
            </div>
          </div>
        </div>

        <div class="learn-footer-cta">
          <h2 class="learn-footer-cta-headline">¿Listo para invertir en tu conocimiento?</h2>
          <p class="learn-footer-cta-sub">Únete a cientos de inversores que aprenden a navegar el cripto con confianza.</p>
          <button class="cta learn-footer-cta-btn" id="learnScrollToCoursesBtn">Ver cursos</button>
        </div>

      </div>
    </div>
    ${EsLearnEnrollModal()}
  `;
}

/* ---------- ES Modals (same IDs as EN — only one set rendered at a time) ---------- */

function EsLimitModal() {
  return `
    <div class="modalBackdrop" id="limitModal">
      <div class="modal">
        <div class="modalTop">
          <div>
            <div class="modalTitle">Ya usaste tus 3 comparaciones gratuitas de hoy</div>
            <div class="muted">Los traders que actualizan obtienen escaneos ilimitados — sin esperar hasta mañana.</div>
          </div>
          <button class="x" id="closeLimit">✕</button>
        </div>

        <div class="insList" style="padding:8px 0;">
          <div class="bullet">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:20px;">∞</span>
              <div>
                <div style="font-weight:700;">Comparaciones ilimitadas</div>
                <div class="muted small">Haz todos los escaneos que necesites — sin límite diario.</div>
              </div>
            </div>
          </div>
          <div class="bullet" style="margin-top:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:20px;">⚡</span>
              <div>
                <div style="font-weight:700;">Alertas de arbitraje</div>
                <div class="muted small">Recibe notificaciones cuando los spreads suban en tus exchanges rastreados.</div>
              </div>
            </div>
          </div>
          <div class="bullet" style="margin-top:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:20px;">📊</span>
              <div>
                <div style="font-weight:700;">Dashboards guardados</div>
                <div class="muted small">Guarda tus mejores configuraciones y reabrelas con un clic.</div>
              </div>
            </div>
          </div>
          <div class="bullet" style="margin-top:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:20px;">🤖</span>
              <div>
                <div style="font-weight:700;">Acceso al Bot de Trading con IA</div>
                <div class="muted small">Desbloquea el bot en planes Premium a medida que se lanza esta función.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="referralBar">
          <input class="input" id="referralCodeInput" placeholder="Código de referido (prueba: crypto)" />
          <button class="btnAlt" id="applyReferralCodeBtn">Aplicar</button>
        </div>
        <div class="muted small" id="referralStatus" style="margin-top:8px;"></div>

        <div class="modalCtas">
          <button class="ctaWide" id="goPricingFromLimit">Activar Premium — $20/mes</button>
        </div>

        <div class="finePrint">Los insights son basados en la comunidad y de apoyo a decisiones — no son consejos de inversión.</div>
      </div>
    </div>
  `;
}

function EsInsightsModal() {
  return `
    <div class="modalBackdrop" id="insightsModal">
      <div class="modal big">
        <div class="modalTop">
          <div>
            <div class="modalTitle" id="insTitle">Insight Comunitario</div>
            <div class="muted" id="insSubtitle">Snapshot en vivo de convicción colectiva + momentum</div>
          </div>
          <button class="x" id="closeInsights">✕</button>
        </div>

        <div class="insBadges" id="insBadges"></div>
        <div class="insList" id="insBullets"></div>

        <div class="noteBox" style="margin:10px 6px 0;">
          <div class="muted small" style="line-height:1.35;">
            <b>Ventaja Premium:</b> Recibe alertas anticipadas cuando la multitud cambia, rastrea la convicción en el tiempo y desbloquea overlays de IA "¿qué sigue?".
          </div>
        </div>

        <div class="modalCtas">
          <button class="ghostWide" id="createAlert">Crear alerta (2 gratis con cuenta)</button>
          <button class="ctaWide" id="goPricingFromInsights">Activar ventaja Premium</button>
        </div>

        <div class="finePrint">Apoyo a decisiones basado en la comunidad — no son consejos de inversión.</div>
      </div>
    </div>
  `;
}

function EsExchangeInsightModal() {
  return `
    <div class="modalBackdrop" id="exchangeModal">
      <div class="modal big">
        <div class="modalTop">
          <div>
            <div class="modalTitle" id="exTitle">Insight de Exchange</div>
            <div class="muted">Compara exchanges como un profesional — ventajas, desventajas y lo que realmente importa a los traders.</div>
          </div>
          <button class="x" id="closeExchange">✕</button>
        </div>

        <div class="exImpact">
          <div class="impactCard good">
            <div class="impactHdr">Por qué los traders lo eligen</div>
            <ul>
              <li>Liquidez + calidad de ejecución en principales</li>
              <li>Profundidad de funciones (spot, perps, earn, etc.)</li>
              <li>Herramientas que se adaptan al trading activo</li>
            </ul>
          </div>
          <div class="impactCard watch">
            <div class="impactHdr">Puntos de atención</div>
            <ul>
              <li>Disponibilidad regional + restricciones</li>
              <li>Los niveles de comisiones varían según volumen</li>
              <li>La preferencia de UI/UX importa más de lo que la gente admite</li>
            </ul>
          </div>
        </div>

        <div class="partnerStrip">
          <div class="muted">Beneficios Premium</div>
          <div class="partnerPills">
            <span class="pillLite">Descuentos en comisiones</span>
            <span class="pillLite">Bonos de registro</span>
            <span class="pillLite">Notas regionales</span>
            <span class="pillLite">Disparadores de alertas</span>
          </div>
        </div>

        <div class="modalCtas">
          <button class="ctaWide" id="goPricingFromExchange">Activar beneficios Premium</button>
        </div>

        <div class="finePrint">Usa los insights de exchange para comparar calidad de ejecución, comisiones y disponibilidad regional antes de fondear.</div>
      </div>
    </div>
  `;
}

function EsAuthModal(state) {
  const mode = state?._authMode === "signup" ? "signup" : "login";
  const authTitle = mode === "signup" ? "Crea tu cuenta gratuita" : "Bienvenido de nuevo";
  const authSubtitle = mode === "signup"
    ? "Guarda configuraciones, activa alertas y mantén tus mejores comparaciones sincronizadas."
    : "Inicia sesión para administrar tus alertas, configuraciones guardadas y dashboard.";
  const toggleLabel = mode === "signup" ? "¿Ya tienes cuenta? Inicia sesión" : "¿Nuevo aquí? Crea una cuenta gratuita";
  const nextMode = mode === "signup" ? "signup" : "login";

  return `
    <div class="modalBackdrop" id="authModal">
      <div class="modal big">
        <div class="modalTop">
          <div>
            <div class="modalTitle" id="authTitle">${authTitle}</div>
            <div class="muted" id="authSubtitle">${authSubtitle}</div>
          </div>
          <button class="x" id="closeAuth">✕</button>
        </div>

        <div class="authModalGrid">
          <div>
            <div>
              <div class="bullet" style="margin-top:8px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="font-size:18px;">💾</div>
                  <div>
                    <div style="font-weight:900;">Guarda dashboards</div>
                    <div class="muted small" style="margin-top:2px;">Reabre tus mejores configuraciones con un clic.</div>
                  </div>
                </div>
              </div>
              <div class="bullet" style="margin-top:8px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="font-size:18px;">⚡</div>
                  <div>
                    <div style="font-weight:900;">Activa alertas por email</div>
                    <div class="muted small" style="margin-top:2px;">Las cuentas gratuitas incluyen 2 créditos de alerta para empezar.</div>
                  </div>
                </div>
              </div>
              <div class="bullet" style="margin-top:8px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="font-size:18px;">🧠</div>
                  <div>
                    <div style="font-weight:900;">Señales Premium</div>
                    <div class="muted small" style="margin-top:2px;">Alertas ilimitadas, mayor inteligencia de exchange, acceso al bot de IA.</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="finePrint" style="padding-left:0; padding-right:0;">
              Los traders usan CompareCrypto.ai para escanear spreads + sentimiento rápidamente — y luego guardan los ganadores.
            </div>
          </div>

          <div>
            <div class="insList" style="padding:0;">
              <div class="bullet" style="margin-top:0;">
                <div class="muted small">Email</div>
                <input class="input" id="authEmail" placeholder="tú@dominio.com" />
              </div>
              <div class="bullet" style="margin-top:10px;">
                <div class="muted small">Contraseña</div>
                <input class="input" id="authPass" type="password" placeholder="••••••••" />
              </div>
              <div class="muted small" id="authStatus" style="margin-top:12px;"></div>
              <div class="modalCtas" style="margin-top:14px;">
                <button class="ctaWide" id="authSubmitBtn">Continuar</button>
                <button class="ghostWide" id="toggleAuthModeBtn" data-mode="${nextMode}">${toggleLabel}</button>
              </div>
              <div class="finePrint">
                Sin spam. Solo actualizaciones de cuenta y producto. Puedes eliminar tu cuenta en cualquier momento.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function EsCheckoutModal(state) {
  const plan = state._checkoutPlan || "monthly";
  const planLabel = plan === "yearly" ? "Anual" : "Mensual";
  const planPrice = plan === "yearly" ? "$200/año" : "$20/mes";
  const prefillEmail = state.user?.email || "";

  return `
    <div class="modalBackdrop" id="checkoutModal">
      <div class="modal checkoutModalSize">
        <div class="modalTop">
          <div>
            <div class="modalTitle" id="checkoutPlanTitle">${planLabel} — ${planPrice}</div>
            <div class="muted">Completa tu compra.</div>
          </div>
          <button class="x" id="closeCheckout" aria-label="Cerrar">✕</button>
        </div>

        <div id="checkoutModalContent">
          <div class="checkoutForm">
            <div class="bullet" style="margin-top:0;">
              <div class="muted small">Nombre completo</div>
              <input class="input checkoutInput" id="checkoutFullName" type="text" placeholder="Ana García" />
            </div>
            <div class="bullet" style="margin-top:10px;">
              <div class="muted small">Email</div>
              <input class="input checkoutInput" id="checkoutEmail" type="text" placeholder="tú@dominio.com" value="${escapeHtml(prefillEmail)}" />
            </div>
            <div class="bullet" style="margin-top:10px;">
              <div class="muted small">Número de tarjeta</div>
              <input class="input checkoutCardNumber" id="checkoutCardNumber" type="text" inputmode="numeric" placeholder="4242 4242 4242 4242" maxlength="19" />
            </div>
            <div class="checkoutRow">
              <div class="bullet" style="margin-top:10px; flex:1;">
                <div class="muted small">Vencimiento (MM/AA)</div>
                <input class="input checkoutInput" id="checkoutExpiry" type="text" placeholder="12/28" maxlength="5" />
              </div>
              <div class="bullet" style="margin-top:10px; flex:1;">
                <div class="muted small">CVV</div>
                <input class="input checkoutInput" id="checkoutCvv" type="text" inputmode="numeric" placeholder="123" maxlength="4" />
              </div>
            </div>
            <div class="bullet" style="margin-top:10px;">
              <div class="muted small">Código postal</div>
              <input class="input checkoutInput" id="checkoutZip" type="text" placeholder="10001" />
            </div>
            <div class="modalCtas" style="margin-top:16px;">
              <button class="ctaWide" id="checkoutPayBtn">Pagar ahora</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function EsTrialModal(state) {
  const trialUntil = state.trialUntil || Date.now() + 3 * 24 * 60 * 60 * 1000;
  const initialCountdown = formatTrialCountdown(trialUntil);

  return `
    <div class="modalBackdrop" id="trialModal">
      <div class="modal trialModalSize">
        <div class="modalTop trialModalTop">
          <div>
            <div class="trialModalHeadline">Tu trial Premium de 3 días está activo 🎉</div>
            <div class="trialCountdown" id="trialCountdown">${initialCountdown}</div>
          </div>
          <button class="x" id="closeTrialModal" aria-label="Cerrar">✕</button>
        </div>

        <div class="trialUnlockedSection">
          <div class="trialUnlockedTitle">Lo que acabas de desbloquear</div>
          <div class="trialUnlockedGrid">
            <div class="trialUnlockedItem">
              <span class="trialUnlockedIcon">✦</span>
              <span>Predicciones comunitarias (24H) — ve hacia dónde cree la multitud que irán los precios</span>
            </div>
            <div class="trialUnlockedItem">
              <span class="trialUnlockedIcon">✦</span>
              <span>Señales de exchange — mejores rutas de ejecución en 6+ exchanges</span>
            </div>
            <div class="trialUnlockedItem">
              <span class="trialUnlockedIcon">✦</span>
              <span>Alertas de cambio de sentimiento — notificaciones cuando el sentimiento cambia</span>
            </div>
            <div class="trialUnlockedItem">
              <span class="trialUnlockedIcon">✦</span>
              <span>Inteligencia de riesgo completa — puntuación de riesgo profunda por activo</span>
            </div>
          </div>
        </div>

        <div class="modalCtas trialModalCtas">
          <button class="cta ctaTrialModal" id="trialModalCta">Hacer mi primera comparación Premium →</button>
        </div>
      </div>
    </div>
  `;
}

function EsTrialSalesModal(state) {
  const trialUntil = state.trialUntil || Date.now();
  const initialCountdown = formatTrialCountdown(trialUntil);
  const compares = state.lifetimeCompares || 0;
  const savedCount = (state.savedViews || []).length;
  const now = Date.now();
  const hoursLeft = state.trialUntil && state.trialUntil > now
    ? Math.max(1, Math.ceil((state.trialUntil - now) / (60 * 60 * 1000)))
    : 0;

  return `
    <div class="modalBackdrop" id="trialSalesModal">
      <div class="modal trialSalesModalSize">
        <div class="modalTop">
          <div>
            <div class="modalTitle">Estás en Premium — hazlo permanente</div>
            <div class="trialSalesCountdown" id="trialSalesCountdown">${initialCountdown}</div>
          </div>
        </div>

        <div class="trialSalesUsage">
          Has hecho <b>${compares}</b> comparación${compares !== 1 ? "es" : ""} y guardado <b>${savedCount}</b> vista${savedCount !== 1 ? "s" : ""}.
        </div>

        <div class="trialSalesLoseSection">
          <div class="trialUnlockedTitle">Lo que perderás cuando termine el trial</div>
          <div class="trialSalesLoseGrid">
            <div class="trialSalesLoseItem"><span class="trialSalesLoseIcon" aria-hidden="true">✕</span><span>Predicciones comunitarias</span></div>
            <div class="trialSalesLoseItem"><span class="trialSalesLoseIcon" aria-hidden="true">✕</span><span>Señales de exchange</span></div>
            <div class="trialSalesLoseItem"><span class="trialSalesLoseIcon" aria-hidden="true">✕</span><span>Alertas de sentimiento</span></div>
            <div class="trialSalesLoseItem"><span class="trialSalesLoseIcon" aria-hidden="true">✕</span><span>Inteligencia de riesgo completa</span></div>
          </div>
        </div>

        <div class="trialSalesSocialProof">Únete a 2,400+ traders que ya están en Premium</div>
        <div class="trialSalesUrgency">Tu trial vence en ${hoursLeft} hora${hoursLeft !== 1 ? "s" : ""} — actualiza ahora para conservar todo</div>

        <div class="modalCtas trialSalesCtas">
          <button class="cta ctaTrialSales" id="trialSalesUpgradeBtn">Actualizar ahora — asegura tu tarifa →</button>
        </div>
        <div class="trialSalesSecondary">
          <a href="#" class="trialSalesRemindLink" id="trialSalesRemindBtn">Recuérdame mañana</a>
        </div>
      </div>
    </div>
  `;
}

function EsEmailInsightModal(state) {
  const prefill = state?.user?.email || "";
  return `
    <div class="modalBackdrop" id="emailInsightModal">
      <div class="modal modalEmailInsight big">
        <div class="modalTop modalEmailInsightTop">
          <div class="modalEmailInsightHead">
            <h2 class="modalEmailInsightTitle">Análisis semanal del mercado</h2>
            <p class="modalEmailInsightSubline">Un resumen cripto de alta señal, cada semana. Sin ruido, sin spam.</p>
          </div>
          <button class="x" id="closeEmailInsight" aria-label="Cerrar">✕</button>
        </div>

        <div class="emailInsightHeroWrap">
          <img class="emailInsightHeroImage" src="/emailsignup.png" alt="" onerror="this.style.display='none'" />
        </div>

        <div id="emailInsightFormArea">
          <div class="modalEmailInsightForm">
            <label class="muted small" for="weeklyEmailInput">Email</label>
            <input class="input" id="weeklyEmailInput" type="email" placeholder="tú@dominio.com" value="${escapeHtml(prefill)}" />
            <div class="muted small" id="weeklyEmailStatus" aria-live="polite"></div>
          </div>
          <div class="modalCtas modalEmailInsightCtas">
            <button class="ctaWide ctaEmailInsight" id="sendInsightEmail">Envíame el análisis semanal →</button>
          </div>
          <div class="finePrint modalEmailInsightFinePrint">Date de baja cuando quieras. Enviamos una vez por semana.</div>
        </div>
      </div>
    </div>
  `;
}

function EsIntelUpsellModal(state) {
  const authed = !!state?.user;
  return `
    <div class="modalBackdrop" id="intelModal">
      <div class="modal">
        <div class="modalTop">
          <div>
            <div class="modalTitle">Desbloquea intel Premium</div>
            <div class="muted">${
              authed
                ? "Has iniciado sesión. Actualiza para acceder a investigación patrocinada más profunda e informes intel premium."
                : "Obtén investigación patrocinada más profunda, briefings privados e hilos alpha de la comunidad."
            }</div>
          </div>
          <button class="x" id="closeIntelModal">✕</button>
        </div>

        <div class="insList" style="padding:8px 0;">
          <div class="bullet" style="margin-top:0;">
            <b>Patrocinado por Binance</b>
            <div class="muted small" style="margin-top:6px;">Los miembros Premium obtienen intel de exchange más profunda y deep-dives mensuales destacados.</div>
          </div>
        </div>

        <div class="modalCtas">
          ${authed
            ? `<button class="ghostWide" id="openAuthFromIntel">Administrar cuenta</button>
               <button class="ctaWide" id="goPricingFromIntel">Actualizar a Premium</button>`
            : `<button class="ghostWide" id="openAuthFromIntel">Crear cuenta gratuita</button>
               <button class="ctaWide" id="goPricingFromIntel">Ver Premium</button>`
          }
        </div>
      </div>
    </div>
  `;
}

/* ---------- ES Footer + helpers ---------- */

function EsFooter() {
  return `
    <div class="footerShell">
      <footer class="siteFooter">
        <span class="footerLabel">Aviso de riesgo</span>
        <span class="footerText">
          Los activos cripto son altamente volátiles. Nada en CompareCrypto.ai es asesoramiento de inversión. Haz tu propia investigación.
        </span>
      </footer>
    </div>
  `;
}

function EsViewCard(v) {
  const when = new Date(v.ts).toLocaleString("es");
  const chips = (v.items || [])
    .slice(0, 4)
    .map((x) => `<span class="miniChip">${escapeHtml(x)}</span>`)
    .join("");
  const label = v.mode === "exchanges" ? "Escaneo de exchanges" : "Comparación de activos";
  return `
    <button class="viewCard" data-viewid="${v.id}">
      <div class="viewTop">
        <div class="viewTitle">${label}</div>
        <div class="viewTime">${when}</div>
      </div>
      <div class="viewMeta">
        <div class="muted small">${v.mode === "exchanges" ? "Exchanges" : "Activos"}:</div>
        <div class="miniChips">${chips}</div>
      </div>
      <div class="viewFooter">
        <div class="muted small">${escapeHtml(v.note || "Vista guardada")}</div>
        <div class="reopen">Reabrir →</div>
      </div>
    </button>
  `;
}

function EsEmptyDash() {
  return `
    <div class="emptyDash">
      <div class="emptyTitle">Sin comparaciones guardadas aún</div>
      <div class="muted small">
        <div>Aquí es donde viven tus mejores configuraciones de mercado.</div>
        <div style="margin-top:4px;">Haz una comparación, haz clic en <b>Guardar vista</b> y podrás reabrirla al instante cuando cambien las condiciones.</div>
      </div>
      <a class="btnInline" href="#es-compare" style="margin-top:10px;">Ir a comparar</a>
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
