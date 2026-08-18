/**
 * Date → 'yyyyMMdd' 문자열.
 */
export function formatDateBasic(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * 오늘 기준 N개월 전 Date. 원본 today는 변경하지 않음.
 */
export function getDateMonthsAgo(months, today = new Date()) {
  const date = new Date(today);
  date.setMonth(date.getMonth() - months);
  return date;
}

/**
 * yyyy-MM-dd 형식 날짜를 한국어 표시 형식으로 변환.
 */
export function formatLocalDate(value) {
  if (!value) return "—";

  const [year, month, day] = String(value).split("-").map(Number);
  if (![year, month, day].every(Number.isInteger)) return "—";

  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
}

export function formatLocalDateTime(value) {
  if (!value) return "—";

  const [datePart, timePart] = String(value).split(" ");
  const formattedDate = formatLocalDate(datePart);
  if (formattedDate === "—" || !timePart) return formattedDate;

  return `${formattedDate} ${timePart.slice(0, 5)}`;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RECENT_DAY_LIMIT = 6;
const HAS_TIMEZONE_DESIGNATOR = /[Zz]|[+-]\d{2}:\d{2}$/;

/**
 * ISO 형식 일시를 "방금 전"·"N분 전"·"N시간 전"·"N일 전"·"M월 D일" 형식으로 변환.
 * 알림 API의 createdAt은 타임존 표기 없이 UTC 값으로 내려오므로 "Z"를 보정해서 파싱한다.
 */
export function formatRelativeTime(value, now = new Date()) {
  if (!value) return "";

  const isoValue = HAS_TIMEZONE_DESIGNATOR.test(value) ? value : `${value}Z`;
  const target = new Date(isoValue);
  if (Number.isNaN(target.getTime())) return "";

  const diffMs = now.getTime() - target.getTime();
  if (diffMs < MINUTE_MS) return "방금 전";
  if (diffMs < HOUR_MS) return `${Math.floor(diffMs / MINUTE_MS)}분 전`;
  if (diffMs < DAY_MS) return `${Math.floor(diffMs / HOUR_MS)}시간 전`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const dayDiff = Math.round((startOfToday - startOfTarget) / DAY_MS);

  if (dayDiff >= 1 && dayDiff <= RECENT_DAY_LIMIT) return `${dayDiff}일 전`;

  return `${target.getMonth() + 1}월 ${target.getDate()}일`;
}
