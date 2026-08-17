export const CHART_PERIODS = Object.freeze([
  { key: "D", label: "일", monthsBack: 3 },
  { key: "W", label: "주", monthsBack: 12 },
  { key: "M", label: "월", monthsBack: 60 },
]);

export const CHART_PERIOD_KEYS = Object.freeze(
  CHART_PERIODS.map((period) => period.key),
);

export function getChartPeriod(key) {
  return CHART_PERIODS.find((period) => period.key === key) ?? CHART_PERIODS[0];
}

/**
 * lightweight-charts 색상 팔레트.
 * tailwind.config.js의 profit/loss/muted/line/ink/surface와 동기화 유지.
 * 캔버스 기반 라이브러리라 hex 문자열이 불가피 — 다른 컴포넌트에선 hex 직접 사용 금지.
 */
export const CHART_COLORS = Object.freeze({
  up: "#FF6B9D", // profit (상승 = 핑크, 한국식)
  down: "#5B8BF7", // loss (하락 = 블루, 한국식)
  text: "#8B8A85", // muted
  grid: "#E4E3E0", // line
  background: "#FFFFFF", // white
  border: "#E4E3E0", // line
});
