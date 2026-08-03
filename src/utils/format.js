/**
 * 통화 포맷 (원화). 부호 없이 표시.
 * null → '—'
 * ex) 75300 → "75,300원"
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("ko-KR")}원`;
}

/**
 * 부호 있는 통화 포맷.
 * null → '—'
 * ex) 300 → "+300원", -500 → "-500원", 0 → "0원"
 */
export function formatSignedCurrency(value) {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toLocaleString("ko-KR")}원`;
}

/**
 * 등락률 포맷 (부호 + 소수 둘째자리 %).
 * null → '—', 양수에 '+' 기호 부여.
 * ex) 1.75 → "+1.75%", -1.23 → "-1.23%", 0 → "0.00%"
 */
export function formatRate(value) {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

/**
 * 변동률 포맷 (± 기호 + 소수 둘째자리 %).
 * null → '—'
 * ex) 1.8 → "±1.80%"
 */
export function formatVolatility(value) {
  if (value === null || value === undefined) return "—";
  return `±${Math.abs(value).toFixed(2)}%`;
}

/**
 * 만·천 단위 한국어 금액 포맷.
 * null → '—'
 * ex) 18000 → "1만 8천원", 50000 → "5만원", 7000 → "7천원", 500 → "500원"
 */
export function formatKoreanShortAmount(value) {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(value);
  const man = Math.floor(rounded / 10000);
  const cheon = Math.floor((rounded % 10000) / 1000);
  if (man > 0 && cheon > 0) return `${man}만 ${cheon}천원`;
  if (man > 0) return `${man}만원`;
  if (cheon > 0) return `${cheon}천원`;
  return `${rounded}원`;
}
