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
