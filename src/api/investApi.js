// TODO: 실제 서버 붙이면 http 클라이언트로 교체
const MOCK_SECURITIES = {
  "005930": {
    code: "005930",
    name: "삼성전자",
    market: "KOSPI",
    price: 75300,
    change: 300,
    changeRate: 0.4,
  },
  "035420": {
    code: "035420",
    name: "NAVER",
    market: "KOSPI",
    price: 180000,
    change: -2500,
    changeRate: -1.37,
  },
};

/**
 * 증권 상세 조회. 증권ID(pk)로 종목 정보를 가져온다.
 */
export function fetchSecurity(pk) {
  return Promise.resolve(MOCK_SECURITIES[pk] ?? null);
}
