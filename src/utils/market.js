const MARKET_CONFIG = Object.freeze({
  KOSPI:  { tz: "Asia/Seoul",        open: [9, 0],  close: [15, 30] },
  KOSDAQ: { tz: "Asia/Seoul",        open: [9, 0],  close: [15, 30] },
  KONEX:  { tz: "Asia/Seoul",        open: [9, 0],  close: [15, 30] },
  NYSE:   { tz: "America/New_York",  open: [9, 30], close: [16, 0]  },
  NASDAQ: { tz: "America/New_York",  open: [9, 30], close: [16, 0]  },
  AMEX:   { tz: "America/New_York",  open: [9, 30], close: [16, 0]  },
});

function getLocalParts(tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const find = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = find("weekday"); // "Mon" … "Sun"
  const hour = Number(find("hour"));
  const minute = Number(find("minute"));
  return { weekday, totalMinutes: hour * 60 + minute };
}

/**
 * 현재 시각 기준으로 해당 시장이 열려 있는지 반환.
 * @param {string | null | undefined} market 예: "KOSPI", "NASDAQ"
 * @returns {boolean | null} null = 알 수 없는 시장
 */
export function isMarketOpen(market) {
  const config = MARKET_CONFIG[String(market ?? "").toUpperCase()];
  if (!config) return null;

  const { weekday, totalMinutes } = getLocalParts(config.tz);
  if (weekday === "Sat" || weekday === "Sun") return false;

  const openMinutes = config.open[0] * 60 + config.open[1];
  const closeMinutes = config.close[0] * 60 + config.close[1];
  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
}
