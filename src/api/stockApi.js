import { get } from "@/api/http";

const STOCK_CODE_PATTERN = /^\d{6}$/;

function assertStockCode(code) {
  if (typeof code !== "string" || !STOCK_CODE_PATTERN.test(code)) {
    throw new Error(`유효하지 않은 종목코드입니다: ${code}`);
  }
}

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * 현재 시세 조회.
 * @param {string} code 6자리 종목코드
 */
export function fetchPrice(code) {
  assertStockCode(code);
  return get(`/api/stocks/${code}/price`);
}

/**
 * 차트 조회.
 * @param {string} code 6자리 종목코드
 * @param {{ period?: string, from?: string, to?: string }} options
 *   period: 기본 'D'(일봉). from/to: 'yyyyMMdd'
 */
export function fetchChart(code, { period = "D", from, to } = {}) {
  assertStockCode(code);
  const queryString = buildQuery({ period, from, to });
  return get(`/api/stocks/${code}/chart${queryString}`);
}
