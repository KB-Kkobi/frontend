const MARKET_CONFIG = Object.freeze({
  KOSPI:  { tz: "Asia/Seoul",        open: [9, 0],  close: [15, 30], tzLabel: null },
  KOSDAQ: { tz: "Asia/Seoul",        open: [9, 0],  close: [15, 30], tzLabel: null },
  KONEX:  { tz: "Asia/Seoul",        open: [9, 0],  close: [15, 30], tzLabel: null },
  NYSE:   { tz: "America/New_York",  open: [9, 30], close: [16, 0],  tzLabel: "ET" },
  NASDAQ: { tz: "America/New_York",  open: [9, 30], close: [16, 0],  tzLabel: "ET" },
  AMEX:   { tz: "America/New_York",  open: [9, 30], close: [16, 0],  tzLabel: "ET" },
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

function formatOpenTime([h, m], tzLabel) {
  const period = h < 12 ? "오전" : "오후";
  const hour = h <= 12 ? h : h - 12;
  const base = m === 0 ? `${period} ${hour}시` : `${period} ${hour}시 ${m}분`;
  return tzLabel ? `${base}(${tzLabel})` : base;
}

/**
 * 장이 닫혀 있을 때 다음 거래 가능 시각을 안내하는 문구를 반환.
 * @param {string | null | undefined} market 예: "KOSPI", "NASDAQ"
 * @returns {string}
 */
export function getNextMarketOpenText(market) {
  const config = MARKET_CONFIG[String(market ?? "").toUpperCase()];
  if (!config) return "현재 거래 가능 시간이 아닙니다.";

  const { weekday, totalMinutes } = getLocalParts(config.tz);
  const openMinutes = config.open[0] * 60 + config.open[1];
  const timeText = formatOpenTime(config.open, config.tzLabel);

  if (weekday === "Sat" || weekday === "Sun") {
    return `월요일 ${timeText}부터 주문할 수 있어요`;
  }
  if (totalMinutes < openMinutes) {
    return `오늘 ${timeText}부터 주문할 수 있어요`;
  }
  return `다음 거래일 ${timeText}부터 주문할 수 있어요`;
}
