import { get, post, remove } from "@/api/http";
import { ORDER_METHOD } from "@/constants/trade";

const ACCOUNTS_PATH = "/api/accounts/me";
const SECURITIES_PATH = "/api/securities";
const ORDERS_PATH = "/api/orders";

/**
 * 내 포트폴리오 조회 (총자산, 현금잔고 등)
 */
export async function fetchPortfolio() {
  const res = await get(`${ACCOUNTS_PATH}/portfolio`);
  return res?.data ?? res;
}

/**
 * 내 보유 종목 목록 조회
 */
export async function fetchHoldings() {
  const res = await get(`${ACCOUNTS_PATH}/holdings`);
  return res?.data ?? res;
}

/**
 * 단일 종목 현재가 조회
 * @param {number} securityId
 */
export async function fetchQuote(securityId) {
  const res = await get(`${SECURITIES_PATH}/${securityId}/quote`);
  return res?.data ?? res;
}

/**
 * 종목 주문가능 정보 조회 (주문가능금액, 최대매수수량 등)
 * @param {number} securityId
 */
export async function fetchOrderable(securityId) {
  const res = await get(`${SECURITIES_PATH}/${securityId}/orderable`);
  return res?.data ?? res;
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
  return remove(`${ORDERS_PATH}/${securityOrderId}`);
}

/**
 * 주문 목록 조회
 * undefined/null 파라미터는 쿼리스트링에서 제외된다.
 * @param {{ status?: string, securityId?: number, from?: string, to?: string, page?: number, size?: number }} params
 */
export async function fetchOrders(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  const res = await get(queryString ? `${ORDERS_PATH}?${queryString}` : ORDERS_PATH);
  return res?.data ?? res;
}
