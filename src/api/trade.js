import { get, post, del } from "@/api/http";
import { ORDER_METHOD } from "@/constants/trade";

const ACCOUNTS_PATH = "/api/accounts/me";
const SECURITIES_PATH = "/api/securities";
const ORDERS_PATH = "/api/orders";

/**
 * 내 포트폴리오 조회 (총자산, 현금잔고 등)
 */
export function fetchPortfolio() {
  return get(`${ACCOUNTS_PATH}/portfolio`);
}

/**
 * 내 보유 종목 목록 조회
 */
export function fetchHoldings() {
  return get(`${ACCOUNTS_PATH}/holdings`);
}

/**
 * 단일 종목 현재가 조회
 * @param {number} securityId
 */
export function fetchQuote(securityId) {
  return get(`${SECURITIES_PATH}/${securityId}/quote`);
}

/**
 * 종목 주문가능 정보 조회 (주문가능금액, 최대매수수량 등)
 * @param {number} securityId
 */
export function fetchOrderable(securityId) {
  return get(`${SECURITIES_PATH}/${securityId}/orderable`);
}

/**
 * 주문 생성
 * 시장가(MARKET) 주문은 price를 body에 포함하지 않는다.
 * @param {{ securityId: number, orderType: string, orderMethod: string, price?: number, quantity: number }} param0
 */
export function createOrder({ securityId, orderType, orderMethod, price, quantity }) {
  const body = { securityId, orderType, orderMethod, quantity };

  if (orderMethod !== ORDER_METHOD.MARKET) {
    body.price = price;
  }

  return post(ORDERS_PATH, body);
}

/**
 * 주문 취소
 * @param {number} securityOrderId
 */
export function cancelOrder(securityOrderId) {
  return del(`${ORDERS_PATH}/${securityOrderId}`);
}

/**
 * 주문 목록 조회
 * undefined/null 파라미터는 쿼리스트링에서 제외된다.
 * @param {{ status?: string, securityId?: number, from?: string, to?: string, page?: number, size?: number }} params
 */
export function fetchOrders(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return get(queryString ? `${ORDERS_PATH}?${queryString}` : ORDERS_PATH);
}
