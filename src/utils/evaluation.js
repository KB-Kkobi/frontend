/** 유한수(number & Number.isFinite)인지 확인 */
function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * 평가금액 = 현재가 × 수량
 * - 현재가 또는 수량이 유효 숫자가 아니면 null
 * - 수량 0은 정상 통과 → 0 반환
 */
export function calcEvaluationAmount(currentPrice, quantity) {
  if (!isNum(currentPrice) || !isNum(quantity)) return null;
  return currentPrice * quantity;
}

/**
 * 평가손익 = (현재가 - 평균단가) × 수량
 * - 현재가·수량 무효이거나 평균단가가 무효/0이면 null
 *   (평균단가 0 = 매수 이력 없음으로 간주)
 */
export function calcProfitLoss(currentPrice, avgPrice, quantity) {
  if (!isNum(currentPrice) || !isNum(quantity) || !isNum(avgPrice) || avgPrice === 0)
    return null;
  return (currentPrice - avgPrice) * quantity;
}

/**
 * 수익률(%) = (현재가 - 평균단가) / 평균단가 × 100
 * - 현재가 무효이거나 평균단가가 무효/0이면 null
 *   (평균단가 0 = 나눗셈 불가)
 */
export function calcProfitRate(currentPrice, avgPrice) {
  if (!isNum(currentPrice) || !isNum(avgPrice) || avgPrice === 0) return null;
  return ((currentPrice - avgPrice) / avgPrice) * 100;
}
