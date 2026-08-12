export const ORDER_TYPE = {
  BUY: "BUY",
  SELL: "SELL",
};

export const ORDER_METHOD = {
  MARKET: "MARKET",
  LIMIT: "LIMIT",
};

export const ORDER_STATUS = {
  PENDING: "PENDING",
  FILLED: "FILLED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  REJECTED: "REJECTED",
};

// 실시간 시세(price feed) 연결 상태
export const PRICE_FEED_STATUS = Object.freeze({
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  FAILED: "failed",
});

// 재연결 실패로 FAILED 상태 전환까지 허용하는 최대 재시도 횟수
export const PRICE_FEED_MAX_RECONNECT_ATTEMPTS = 5;

// 에러 코드 → 사용자 노출 문구 (명세 3.5절 기준)
export const ORDER_ERROR_MESSAGE = {
  INVALID_QUANTITY: "수량은 1주 이상 입력해주세요.",
  INVALID_PRICE: "주문 가격을 확인해주세요.",
  PRICE_REQUIRED_FOR_LIMIT: "지정가 주문은 가격을 입력해야 합니다.",
  INSUFFICIENT_CASH: "주문가능금액이 부족합니다.",
  INSUFFICIENT_QUANTITY: "매도 가능 수량을 초과했습니다.",
  SECURITY_NOT_FOUND: "종목 정보를 찾을 수 없습니다.",
  MARKET_CLOSED: "지금은 거래 시간이 아닙니다. (평일 09:00~15:30)",
  QUOTE_UNAVAILABLE:
    "현재가를 불러오지 못해 주문할 수 없습니다. 잠시 후 다시 시도해주세요.",
  ORDER_NOT_FOUND: "주문을 찾을 수 없습니다.",
  ORDER_NOT_CANCELABLE: "이미 처리된 주문은 취소할 수 없습니다.",
  FORBIDDEN_ORDER: "접근 권한이 없습니다.",
};
