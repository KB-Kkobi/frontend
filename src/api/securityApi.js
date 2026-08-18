import { get, post } from "@/api/http";
import {
  SECURITY_LIST_DEFAULTS,
  SECURITY_LIST_MAX_SIZE,
  SECURITY_QUOTE_MAX_TICKERS,
  isSecurityType,
  normalizeSecurityType,
} from "@/constants/security";

const SECURITY_API_PATH = "/api/securities";
const SECURITY_QUOTES_PATH = `${SECURITY_API_PATH}/quotes`;
const SECURITY_RECOMMENDATIONS_PATH = `${SECURITY_API_PATH}/recommendations`;

function assertTicker(ticker) {
  if (typeof ticker !== "string" || ticker.trim() === "") {
    throw new Error("ticker는 필수입니다.");
  }
}

function clampListSize(size) {
  const parsed = Number(size);
  if (!Number.isInteger(parsed) || parsed <= 0) return SECURITY_LIST_DEFAULTS.size;
  return Math.min(parsed, SECURITY_LIST_MAX_SIZE);
}

function normalizeListPage(page) {
  const parsed = Number(page);
  if (!Number.isInteger(parsed) || parsed <= 0) return SECURITY_LIST_DEFAULTS.page;
  return parsed;
}

function buildSecurityListQuery({ types, page, size, keyword, sort } = {}) {
  const query = new URLSearchParams();
  query.set("page", String(normalizeListPage(page ?? SECURITY_LIST_DEFAULTS.page)));
  query.set("size", String(clampListSize(size ?? SECURITY_LIST_DEFAULTS.size)));

  if (Array.isArray(types) && types.length > 0) {
    for (const t of types) {
      const normalized = normalizeSecurityType(t);
      if (!isSecurityType(normalized)) {
        throw new Error(`types 파라미터 값이 올바르지 않습니다: ${t}`);
      }
      query.append("types", normalized);
    }
  }

  if (keyword && typeof keyword === "string" && keyword.trim()) {
    query.set("keyword", keyword.trim());
  }

  if (sort && typeof sort === "string" && sort.trim()) {
    query.set("sort", sort.trim());
  }

  return query.toString();
}

function normalizeSecurityListItem(item) {
  return {
    securityId: item?.securityId ?? null,
    ticker: item?.ticker ?? "",
    name: item?.name ?? "",
    type: item?.type ?? null,
    kisSupported: Boolean(item?.kisSupported),
    matchScore: item?.matchScore != null ? Number(item.matchScore) : null,
  };
}

function normalizeSecurityListResponse(response) {
  return {
    content: Array.isArray(response?.content)
      ? response.content.map(normalizeSecurityListItem)
      : [],
    page: response?.page ?? SECURITY_LIST_DEFAULTS.page,
    size: response?.size ?? SECURITY_LIST_DEFAULTS.size,
    totalElements: response?.totalElements ?? 0,
    totalPages: response?.totalPages ?? 0,
  };
}

function normalizeRecommendedSecurityItem(item) {
  return {
    ...normalizeSecurityListItem(item),
    matchScore: item?.matchScore ?? null,
    volume: item?.volume ?? null,
    changeRate: item?.changeRate ?? null,
  };
}

function normalizeSecurityRecommendationResponse(response) {
  return {
    content: Array.isArray(response?.content)
      ? response.content.map(normalizeRecommendedSecurityItem)
      : [],
    sortFallback: Boolean(response?.sortFallback),
    appliedSort: response?.appliedSort ?? "volume",
  };
}

function normalizeSecurityDetail(response) {
  return {
    securityId: response?.securityId ?? null,
    ticker: response?.ticker ?? "",
    name: response?.name ?? "",
    type: response?.type ?? null,
    kisSupported: Boolean(response?.kisSupported),
    market: response?.market ?? null,
    sector: response?.sector ?? null,
    marketCap: response?.marketCap ?? null,
    volatility: response?.volatility ?? null,
    maxDrawdown: response?.maxDrawdown ?? null,
    averageDailyMove: response?.averageDailyMove ?? null,
    averageVolume: response?.averageVolume ?? null,
  };
}

function normalizeQuote(item) {
  return {
    ticker: item?.ticker ?? "",
    kisCode: item?.kisCode ?? null,
    supported: Boolean(item?.supported),
    price: item?.price ?? null,
    change: item?.change ?? null,
    changeRate: item?.changeRate ?? null,
    prevClose: item?.prevClose ?? null,
    asOf: item?.asOf ?? null,
    error: item?.error ?? null,
  };
}

function normalizeQuotesResponse(response) {
  return {
    quotes: Array.isArray(response?.quotes)
      ? response.quotes.map(normalizeQuote)
      : [],
  };
}

function sanitizeQuoteTickers(tickers) {
  if (!Array.isArray(tickers)) {
    throw new Error("tickers는 1개 이상이어야 합니다.");
  }
  const cleaned = [];
  const seen = new Set();
  for (const raw of tickers) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
  }
  if (cleaned.length === 0) {
    throw new Error("tickers는 1개 이상이어야 합니다.");
  }
  if (cleaned.length > SECURITY_QUOTE_MAX_TICKERS) {
    throw new Error(
      `tickers는 최대 ${SECURITY_QUOTE_MAX_TICKERS}개까지 요청할 수 있습니다.`,
    );
  }
  return cleaned;
}

/**
 * 증권 목록 조회.
 * @param {{ types?: string[], page?: number, size?: number, keyword?: string }} params
 */
export async function fetchSecurityList(params) {
  const queryString = buildSecurityListQuery(params);
  const response = await get(`${SECURITY_API_PATH}?${queryString}`);
  return normalizeSecurityListResponse(response);
}

/**
 * 홈 화면 추천 종목 조회 (주식·주식형 ETF 통합 1 + 채권형 ETF 1, 성향 매칭 순).
 */
export async function fetchRecommendedSecurities() {
  const response = await get(SECURITY_RECOMMENDATIONS_PATH);
  return normalizeSecurityRecommendationResponse(response);
}

/**
 * 증권 상세 조회.
 * @param {string} ticker 목록의 ticker 값
 */
export async function fetchSecurityDetail(ticker) {
  assertTicker(ticker);
  const response = await get(`${SECURITY_API_PATH}/${encodeURIComponent(ticker.trim())}`);
  return normalizeSecurityDetail(response);
}

/**
 * 다건 실시간 시세 조회 (KIS).
 * @param {string[]} tickers 1~100개. 서버는 dedupe하지만 클라이언트에서도 정리.
 */
export async function fetchSecurityQuotes(tickers) {
  const payload = { tickers: sanitizeQuoteTickers(tickers) };
  const response = await post(SECURITY_QUOTES_PATH, payload, { skipAuth: true });
  return normalizeQuotesResponse(response);
}
