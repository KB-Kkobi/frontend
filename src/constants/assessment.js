export const AXIS_SCORE_THRESHOLD = 50;

export const AXIS_DEFINITIONS = Object.freeze([
  {
    key: "rtScore",
    label: "위험감수",
    description: "손실을 감수하고 투자할 수 있는 정도",
  },
  {
    key: "lhScore",
    label: "유동성",
    description: "자금을 바로 꺼내 쓸 수 있어야 하는 정도",
  },
  {
    key: "rpScore",
    label: "기대수익",
    description: "목표로 하는 수익 수준",
  },
]);

export function getAxisLevel(score) {
  return score > AXIS_SCORE_THRESHOLD ? "높음" : "낮음";
}

export function getAxisBadgesFromScores(scores) {
  return AXIS_DEFINITIONS.map((axis) => ({
    key: axis.key,
    label: `${axis.label} ${getAxisLevel(scores[axis.key])}`,
  }));
}

const AXIS_CODE_LEVEL_LABELS = { H: "높음", L: "낮음" };

export function getAxisBadgesFromCode(axisCode) {
  return AXIS_DEFINITIONS.map((axis, index) => ({
    key: axis.key,
    label: `${axis.label} ${AXIS_CODE_LEVEL_LABELS[axisCode?.[index]] ?? "-"}`,
  }));
}

export const PORTFOLIO_SEGMENT_DEFINITIONS = Object.freeze([
  { key: "stockRatio", label: "주식", color: "pink" },
  { key: "bondRatio", label: "채권", color: "blue" },
  { key: "depositRatio", label: "예적금", color: "green" },
]);

export const RADAR_AXIS_ORDER = Object.freeze(["rtScore", "rpScore", "lhScore"]);

export const RADAR_VIEWBOX_SIZE = 100;
export const RADAR_CENTER = RADAR_VIEWBOX_SIZE / 2;
export const RADAR_RADIUS = 34;
export const RADAR_LABEL_OFFSET = 10;
export const RADAR_GRID_STEPS = [0.25, 0.5, 0.75, 1];
export const RADAR_MAX_SCORE = 100;
export const RADAR_AXIS_ANGLES_DEG = [-90, 30, 150];
export const RADAR_LABEL_FONT_SIZE = 5;

export const DONUT_VIEWBOX_SIZE = 100;
export const DONUT_CENTER = DONUT_VIEWBOX_SIZE / 2;
export const DONUT_RADIUS = 40;
export const DONUT_STROKE_WIDTH = 16;