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
  sort: "maximumInterestRate,desc",
});

export const PRODUCT_SEARCH_DEBOUNCE_MS = 300;

export const PRODUCT_SUBSCRIPTION_ESTIMATE_DEBOUNCE_MS = 400;

export const SAVING_TERM_OPTIONS = Object.freeze([6, 12, 24]);

export const PRODUCT_SORT_OPTIONS = Object.freeze([
  { value: "maximumInterestRate,desc", label: "최고 금리순" },
  { value: "interestRate,desc", label: "기본 금리순" },
  { value: "productName,asc", label: "상품명순" },
  { value: "financialCompanyName,asc", label: "금융회사순" },
]);

export const RESERVE_TYPE_OPTIONS = Object.freeze([
  { value: "", label: "전체" },
  { value: "F", label: "자유적립식" },
  { value: "S", label: "정액적립식" },
]);

export const PREFERENTIAL_CONDITION_OPTIONS = Object.freeze([
  { value: "INCOME_TRANSFER", label: "급여·연금 이체" },
  { value: "CARD_USAGE", label: "카드 이용" },
  { value: "AUTOMATIC_TRANSFER", label: "자동이체" },
  // 기존 백엔드 파서는 첫 거래·신규 고객 조건을 이 코드로 저장한다.
  { value: "MARKETING_CONSENT", label: "첫 거래·신규 고객" },
  { value: "HOUSING_SUBSCRIPTION", label: "주택청약" },
  { value: "OPEN_BANKING", label: "오픈뱅킹" },
  { value: "NON_FACE_TO_FACE", label: "비대면 가입" },
  { value: "OTHER", label: "기타" },
]);

export const PRODUCT_PAYMENT_DAYS = Object.freeze(
  Array.from({ length: 28 }, (_, index) => index + 1),
);

export const PRODUCT_AMOUNT_OPTIONS = Object.freeze({
  [PRODUCT_TYPES.DEPOSIT]: Object.freeze([500000, 1000000, 2000000]),
  [PRODUCT_TYPES.SAVING]: Object.freeze([100000, 200000, 300000, 500000]),
});

export const PRODUCT_HOLDING_STATUSES = Object.freeze({
  ACTIVE: "ACTIVE",
  MATURED: "MATURED",
  TERMINATED: "TERMINATED",
  CANCELLED: "CANCELLED",
});

export const PRODUCT_TRANSACTION_TYPES = Object.freeze({
  SUBSCRIBE: "SUBSCRIBE",
  PAYMENT: "PAYMENT",
  ADDITIONAL_PAYMENT: "ADDITIONAL_PAYMENT",
  TERMINATE: "TERMINATE",
  MATURITY: "MATURITY",
});

const PRODUCT_TYPE_LABELS = Object.freeze({
  [PRODUCT_TYPES.DEPOSIT]: "예금",
  [PRODUCT_TYPES.SAVING]: "적금",
});

const PRODUCT_HOLDING_STATUS_OPTIONS = Object.freeze({
  [PRODUCT_HOLDING_STATUSES.ACTIVE]: { label: "진행 중", color: "green" },
  [PRODUCT_HOLDING_STATUSES.MATURED]: { label: "만기", color: "blue" },
  [PRODUCT_HOLDING_STATUSES.TERMINATED]: { label: "해지", color: "yellow" },
  [PRODUCT_HOLDING_STATUSES.CANCELLED]: { label: "해지", color: "yellow" },
});

const PRODUCT_TRANSACTION_LABELS = Object.freeze({
  [PRODUCT_TRANSACTION_TYPES.SUBSCRIBE]: "가입",
  [PRODUCT_TRANSACTION_TYPES.PAYMENT]: "납입",
  [PRODUCT_TRANSACTION_TYPES.ADDITIONAL_PAYMENT]: "추가 납입",
  [PRODUCT_TRANSACTION_TYPES.TERMINATE]: "해지",
  [PRODUCT_TRANSACTION_TYPES.MATURITY]: "만기",
});

export function normalizeProductType(productType) {
  return String(productType ?? "").toUpperCase();
}

export function getProductTypeLabel(productType) {
  return PRODUCT_TYPE_LABELS[normalizeProductType(productType)] ?? "상품";
}

export function getProductHoldingStatus(status) {
  return (
    PRODUCT_HOLDING_STATUS_OPTIONS[String(status ?? "").toUpperCase()] ?? {
      label: "상태 확인 필요",
      color: "yellow",
    }
  );
}

export function getProductTransactionLabel(transactionType, productType) {
  const typeLabel = getProductTypeLabel(productType);
  const transactionLabel =
    PRODUCT_TRANSACTION_LABELS[String(transactionType ?? "").toUpperCase()] ??
    "거래";
  return `${typeLabel} ${transactionLabel}`;
}
