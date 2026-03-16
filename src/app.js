// app.js renders based on route + state passed in from main.js

export function App(state) {
  const route = state.route || "compare";
  let page = "";

  if (route === "pricing") page = PricingPage(state);
  else if (route === "dashboard") page = DashboardPage(state);
  else if (route === "waitlist") page = WaitlistPage(state);
  else if (route === "account") page = AccountPage(state);
  else if (route === "reset") page = ResetPasswordPage(state);
  else if (route.startsWith("intel/")) page = IntelArticlePage(state);
  else if (route.startsWith("markets/")) page = MarketsArticlePage(state);
  else page = ComparePage(state);

  return `${page}${Footer()}${AuthModal(state)}${IntelUpsellModal(state)}${CommunityPeekModal()}${EmailInsightModal(state)}${CheckoutModal(state)}${TrialModal(state)}${TrialSalesModal(state)}`;
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
      <div class="nav">
        <a href="#compare" class="brand brandLink">
          <img src="/comparelogo.png" alt="CompareCrypto.ai" style="height:36px; width:auto; display:block;" onerror="this.style.display='none'" />
          <span class="brandText">CompareCrypto.ai</span>
        </a>

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
              ${state.user ? `<button class="btnMiniGhost" id="dashEmailInsightBtn">Get weekly insight email</button>` : `<button class="btnMiniGhost" id="dashSignupBtn">Create free account</button>`}
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
  const unlocked = !!state.referralUnlocked;
  const referralCode = state.referralCode || "------";
  const refCount = state.referralCount ?? 0;
  const baseUrl = "https://comparecrypto.ai";
  const refLink = `${baseUrl}?ref=${referralCode}`;
  const emailSubject = "I've been using CompareCrypto.ai — you should try it";
  const emailBody = `Hey, I've been using CompareCrypto.ai to compare crypto assets and exchange rates. Use my referral link to get 3 days of Premium free: ${refLink}`;
  const tweetText = encodeURIComponent(`Just found @CompareCryptoAI — the best way to compare crypto assets and exchange rates. Get 3 days Premium free with my link: ${refLink}`);

  if (!unlocked) {
    return `
            <div class="plan referralCard referralCardLocked">
              <div class="referralHeadline">You have a referral reward waiting</div>
              <div class="referralSubline muted small">Unlock your personal referral link and give friends 3 days Premium free — you get 3 days too for every friend who joins</div>
              <button type="button" class="cta btnFull referralUnlockBtn" id="referralUnlockBtn">🔓 Unlock My Referral Link</button>
            </div>`;
  }

  return `
            <div class="plan referralCard referralCardUnlocked">
              <div class="referralHeadline">Refer & Earn — give 3 days, get 3 days</div>
              <div class="muted small" style="margin-top:6px;">Your referral code</div>
              <div class="referralCodeBlock" id="referralCodeDisplay">${escapeHtml(referralCode)}</div>
              <div class="muted small" style="margin-top:10px;">Share your link:</div>
              <div class="referralShareRow">
                <button type="button" class="referralShareBtn" id="referralCopyBtn" title="Copy link">📋 Copy link</button>
                <a href="mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}" class="referralShareBtn referralShareLink" title="Share via email">✉️ Email</a>
                <a href="https://twitter.com/intent/tweet?text=${tweetText}" target="_blank" rel="noopener noreferrer" class="referralShareBtn referralShareLink" title="Share on X">𝕏 Share</a>
              </div>
              <div id="referralCountLine" class="referralCountLine muted small">You've referred ${refCount} friend${refCount !== 1 ? "s" : ""} — ${refCount} × 3 days earned</div>
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

          <img class="emailInsightHeroImage" src="/emailsignup.png" alt="" onerror="this.style.display='none'" />

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

          <div style="
            display:grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 12px;
            padding: 10px 4px 0;
          ">
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

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
