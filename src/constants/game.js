export const DEFAULT_SCENARIO_ID = 'SC001';

export const CHART_VIEWBOX_WIDTH = 100;
export const CHART_VIEWBOX_HEIGHT = 40;
export const CHART_STROKE_WIDTH = 2.5;
export const CHART_MARKER_RADIUS_PX = 5;
export const CHART_PADDING = 2;
export const CHART_FILL_OPACITY_TOP = 0.18;

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
export const GAME_DEPOSIT_INTEREST_TAX_RATE = 15.4;
export const GAME_ALLOCATION_STEP = 100_000;
export const GAME_EVENT_RESUME_DELAY_MS = 2_500;

export const GAME_INITIAL_ALLOCATION = {
  cash: 3_000_000,
  deposit: 3_000_000,
  stock: 4_000_000,
};

export const GAME_ALLOCATION_ADJUSTMENT_PRIORITY = {
  cash: ["deposit", "stock"],
  deposit: ["stock", "cash"],
  stock: ["cash", "deposit"],
};

// 실제 게임(SC001) tick 재생 간격과 동일하게 맞춤
export const GAME_TUTORIAL_TICK_INTERVAL_MS = 2_500;

// 하락 → 저점(매수) → 상승(매도) → 한 틱 더(예금해지) — 정지 지점 도달에 필요한 최소 tick
export const GAME_TUTORIAL_CHART_PRICES = [
  11000, 10600, 10200, 10600, 11000, 11000,
];
export const GAME_TUTORIAL_LOW_TICK_INDEX = 2;
export const GAME_TUTORIAL_HIGH_TICK_INDEX = 4;
export const GAME_TUTORIAL_DEPOSIT_TICK_INDEX = 5;

// 합계가 GAME_SEED_MONEY와 같아야 GamePortfolioPanel의 손익 계산이 맞음
export const GAME_TUTORIAL_STARTING_ASSET = {
  cashAmount: 3_000_000,
  depositAmount: 1_500_000,
  stockPrincipal: 5_500_000,
  stockQuantity: 500,
  averageStockPrice: 11_000,
};

export const GAME_TUTORIAL_STEPS = [
  {
    action: "buy",
    message: "가격이 내렸어요. 매수해볼까요?",
  },
  {
    action: "sell",
    message: "가격이 올랐어요. 매도해볼까요?",
  },
  {
    action: "cancel-deposit",
    message: "예금도 현금으로 바꿀 수 있어요. 예금 해지 해볼까요?",
  },
];
