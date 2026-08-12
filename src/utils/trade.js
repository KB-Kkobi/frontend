/**
 * 예상 체결금액 = 수량 × 가격 (입력 중 미리보기용)
 * @param {number} quantity
 * @param {number} price
 * @returns {number}
 */
export function calcExpectedAmount(quantity, price) {
  return quantity * price;
}

/**
 * 지정가 기준 최대 매수가능수량 = floor(주문가능금액 / 입력가격)
 * 서버의 maxBuyQuantityAtMarket은 시장가 기준이므로, 지정가는 클라이언트가 계산 (명세 3.4절)
 * @param {number} orderableCash
 * @param {number} price
 * @returns {number}
 */
export function calcMaxBuyQuantity(orderableCash, price) {
  if (!price || price <= 0) return 0;
  return Math.floor(orderableCash / price);
}
