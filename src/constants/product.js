export const PRODUCT_TYPES = Object.freeze({
  DEPOSIT: "DEPOSIT",
  SAVING: "SAVING",
});

export const PRODUCT_TYPE_OPTIONS = Object.freeze([
  { key: PRODUCT_TYPES.DEPOSIT, label: "예금" },
  { key: PRODUCT_TYPES.SAVING, label: "적금" },
]);

export const PRODUCT_LIST_DEFAULTS = Object.freeze({
  page: 1,
  size: 5,
  savingTerm: 12,
  sort: "maximumInterestRate,desc",
});

export const SAVING_TERM_OPTIONS = Object.freeze([6, 12, 24]);

export const PRODUCT_SORT_OPTIONS = Object.freeze([
  { value: "maximumInterestRate,desc", label: "최고 금리순" },
  { value: "maximumInterestRate,asc", label: "최고 금리 낮은순" },
  { value: "interestRate,desc", label: "기본 금리순" },
  { value: "productName,asc", label: "상품명순" },
  { value: "financialCompanyName,asc", label: "금융회사순" },
]);

export const RESERVE_TYPE_OPTIONS = Object.freeze([
  { value: "", label: "전체" },
  { value: "F", label: "자유적립식" },
  { value: "S", label: "정액적립식" },
]);

const PRODUCT_TYPE_LABELS = Object.freeze({
  [PRODUCT_TYPES.DEPOSIT]: "예금",
  [PRODUCT_TYPES.SAVING]: "적금",
});

export function normalizeProductType(productType) {
  return String(productType ?? "").toUpperCase();
}

export function getProductTypeLabel(productType) {
  return PRODUCT_TYPE_LABELS[normalizeProductType(productType)] ?? "상품";
}
