/**
 * 통화 포맷 (원화). 부호 없이 표시.
 * null → '—'
 * ex) 75300 → "75,300원"
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  return `${numericValue.toLocaleString("ko-KR")}원`;
}

/**
 * 부호 있는 통화 포맷.
 * null → '—'
 * ex) 300 → "+300원", -500 → "-500원", 0 → "0원"
 */
export function formatSignedCurrency(value) {
  if (value === null || value === undefined) return "—";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  const sign = numericValue > 0 ? "+" : numericValue < 0 ? "-" : "";
  return `${sign}${Math.abs(numericValue).toLocaleString("ko-KR")}원`;
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
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  const rounded = Math.round(numericValue);
  const man = Math.floor(rounded / 10000);
  const cheon = Math.floor((rounded % 10000) / 1000);
  if (man > 0 && cheon > 0) return `${man}만 ${cheon}천원`;
  if (man > 0) return `${man}만원`;
  if (cheon > 0) return `${cheon}천원`;
  return `${rounded}원`;
}

/**
 * 금리 포맷 (소수 둘째자리 %).
 * null → '—'
 * ex) 3 → "3.00%", 3.25 → "3.25%"
 */
export function formatInterestRate(value) {
  if (value === null || value === undefined) return "—";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  return `${numericValue.toFixed(2)}%`;
}

/**
 * 비어 있는 문자열을 공통 빈 값 기호로 표시.
 */
export function formatNullableText(value) {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text || "—";
}

/**
 * 금액 입력값에서 숫자만 남기고 천 단위 구분 기호를 적용.
 */
export function formatCurrencyInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
}

/**
 * 천 단위 구분 기호가 포함된 금액 입력값을 숫자로 변환.
 */
export function parseCurrencyInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : null;
}
