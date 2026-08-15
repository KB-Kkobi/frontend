export const SECURITY_TYPES = Object.freeze({
  STOCK: "STOCK",
  BOND_ETF: "BOND_ETF",
  EQUITY_ETF: "EQUITY_ETF",
});

const SECURITY_TYPE_LABELS = Object.freeze({
  [SECURITY_TYPES.STOCK]: "주식",
  [SECURITY_TYPES.BOND_ETF]: "채권 ETF",
  [SECURITY_TYPES.EQUITY_ETF]: "주식형 ETF",
});

export const SECURITY_TYPE_FILTER_OPTIONS = Object.freeze([
  { value: "", label: "전체" },
  { value: SECURITY_TYPES.STOCK, label: SECURITY_TYPE_LABELS[SECURITY_TYPES.STOCK] },
  { value: SECURITY_TYPES.BOND_ETF, label: SECURITY_TYPE_LABELS[SECURITY_TYPES.BOND_ETF] },
  { value: SECURITY_TYPES.EQUITY_ETF, label: SECURITY_TYPE_LABELS[SECURITY_TYPES.EQUITY_ETF] },
]);

export const SECURITY_LIST_SIZE_OPTIONS = Object.freeze([10, 20, 50, 100]);

export const SECURITY_LIST_MAX_SIZE = 100;

export const SECURITY_LIST_DEFAULTS = Object.freeze({
  page: 1,
  size: SECURITY_LIST_SIZE_OPTIONS[0],
  sort: "match",
});

export const SECURITY_SORT_OPTIONS = Object.freeze([
  { value: "match",  label: "매칭순" },
  { value: "volume", label: "거래량순" },
  { value: "name",   label: "종목명순" },
]);

export const SECURITY_FILTER_TYPE_OPTIONS = Object.freeze([
  { value: SECURITY_TYPES.STOCK, label: "주식" },
  { value: SECURITY_TYPES.BOND_ETF, label: "채권형 ETF" },
  { value: SECURITY_TYPES.EQUITY_ETF, label: "주식형 ETF" },
]);

export const SECURITY_QUOTE_MAX_TICKERS = 100;

export const SECURITY_QUOTE_POLL_INTERVAL_MS = 7000;

export function normalizeSecurityType(type) {
  return String(type ?? "").toUpperCase();
}

export function isSecurityType(type) {
  return Object.prototype.hasOwnProperty.call(
    SECURITY_TYPE_LABELS,
    normalizeSecurityType(type),
  );
}

export function getSecurityTypeLabel(type) {
  return SECURITY_TYPE_LABELS[normalizeSecurityType(type)] ?? "-";
}

const SECURITY_CATEGORY_PILLS = Object.freeze({
  [SECURITY_TYPES.STOCK]: { label: "주식", color: "pink" },
  [SECURITY_TYPES.EQUITY_ETF]: { label: "주식", color: "pink" },
  [SECURITY_TYPES.BOND_ETF]: { label: "채권", color: "green" },
});

export function getSecurityCategoryPill(type) {
  return SECURITY_CATEGORY_PILLS[normalizeSecurityType(type)] ?? null;
}
