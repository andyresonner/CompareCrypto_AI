const KEY = "cc_usage_v1";

/**
 * Usage model:
 * - freeComparisonsPerDay: 3
 * - usage resets daily (local date)
 */
function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getUsage() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const fresh = { day: todayKey(), used: 0, freeLimit: 3 };
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.day !== todayKey()) {
      const reset = { day: todayKey(), used: 0, freeLimit: 3 };
      localStorage.setItem(KEY, JSON.stringify(reset));
      return reset;
    }
    if (typeof parsed.freeLimit !== "number") parsed.freeLimit = 3;
    if (typeof parsed.used !== "number") parsed.used = 0;
    return parsed;
  } catch {
    const reset = { day: todayKey(), used: 0, freeLimit: 3 };
    localStorage.setItem(KEY, JSON.stringify(reset));
    return reset;
  }
}

export function canCompare() {
  const u = getUsage();
  return u.used < u.freeLimit;
}

export function incrementUsage() {
  const u = getUsage();
  u.used += 1;
  localStorage.setItem(KEY, JSON.stringify(u));
  return u;
}

export function remainingComparisons() {
  const u = getUsage();
  return Math.max(0, u.freeLimit - u.used);
}

export function resetDemoUsage() {
  const reset = { day: todayKey(), used: 0, freeLimit: 3 };
  localStorage.setItem(KEY, JSON.stringify(reset));
  return reset;
}
