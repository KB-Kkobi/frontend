export const DEFAULT_SCENARIO_ID = 'SC001';

export const CHART_VIEWBOX_WIDTH = 100;
export const CHART_VIEWBOX_HEIGHT = 40;
export const CHART_STROKE_WIDTH = 3;
export const CHART_MARKER_RADIUS = 1;
export const CHART_PADDING = 5;

export const GAME_INTRO_PREVIEW_PRICES = [
  13200, 13450, 13150, 12700, 12950, 13600,
];

export const GAME_INTRO_STEPS = [
  {
    title: '자산을 배분해요',
    description: '현금·예금·주식에 시작 자산을 나눠 담아요.',
  },
  {
    title: '3분간 게임을 진행해요',
    description: '시장 이벤트를 확인하고 직접 투자 행동을 선택해요.',
  },
  {
    title: '투자 성향을 확인해요',
    description: '선택한 행동을 분석해 8가지 성향 중 하나를 알려드려요.',
  },
];

export const GAME_SEED_MONEY = 10_000_000;
export const GAME_DURATION_MONTHS = 12;
export const GAME_DEPOSIT_MONTHS = 12;
export const GAME_DEPOSIT_INTEREST_RATE = 3.5;
export const GAME_ALLOCATION_STEP = 100_000;

export const GAME_INITIAL_ALLOCATION = {
  cash: 3_000_000,
  deposit: 3_000_000,
  stock: 4_000_000,
};

export const GAME_ALLOCATION_ADJUSTMENT_PRIORITY = {
  cash: ["deposit", "stock"],
  deposit: ["cash", "stock"],
  stock: ["cash", "deposit"],
};
