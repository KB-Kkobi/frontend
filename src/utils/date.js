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

/**
 * LocalDate.plusMonths와 동일하게 말일을 보정해 예상 만기일을 계산.
 */
export function calculateMaturityDate(savingTerm, startDate = new Date()) {
  const months = Number(savingTerm);
  if (!Number.isInteger(months) || months <= 0) return null;

  const result = new Date(startDate);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(originalDay, lastDay));

  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, "0");
  const day = String(result.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
