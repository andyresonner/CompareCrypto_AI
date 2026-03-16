// Vercel serverless proxy for Yahoo Finance v8 chart API (NASDAQ, S&P 500).
// Avoids CORS and rate limits when the dashboard fetches equity data from the browser.

const YAHOO_IXIC = "https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=2d";
const YAHOO_GSPC = "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=2d";

function parseChart(data) {
  const result = data?.chart?.result?.[0];
  if (!result?.meta) return null;
  const price = Number(result.meta.regularMarketPrice);
  const prev = Number(result.meta.chartPreviousClose);
  if (!Number.isFinite(price)) return null;
  const change =
    Number.isFinite(prev) && prev > 0 ? ((price - prev) / prev) * 100 : null;
  return { price, change };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Cache-Control",
    "s-maxage=300, stale-while-revalidate"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [nasdaqRes, sp500Res] = await Promise.all([
      fetch(YAHOO_IXIC),
      fetch(YAHOO_GSPC),
    ]);

    if (!nasdaqRes.ok || !sp500Res.ok) {
      return res.status(502).json({
        error: "Upstream error",
        nasdaq: nasdaqRes.ok ? null : nasdaqRes.status,
        sp500: sp500Res.ok ? null : sp500Res.status,
      });
    }

    const [nasdaqData, sp500Data] = await Promise.all([
      nasdaqRes.json(),
      sp500Res.json(),
    ]);

    const nasdaq = parseChart(nasdaqData);
    const sp500 = parseChart(sp500Data);

    if (!nasdaq || !sp500) {
      return res.status(502).json({
        error: "Invalid upstream data",
        nasdaq: nasdaq ? { price: nasdaq.price, change: nasdaq.change } : null,
        sp500: sp500 ? { price: sp500.price, change: sp500.change } : null,
      });
    }

    return res.status(200).json({
      nasdaq: { price: nasdaq.price, change: nasdaq.change },
      sp500: { price: sp500.price, change: sp500.change },
    });
  } catch (err) {
    console.error("api/equity:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
