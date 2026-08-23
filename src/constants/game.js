export const DEFAULT_SCENARIO_ID = 'SC001';

export const CHART_VIEWBOX_WIDTH = 100;
export const CHART_VIEWBOX_HEIGHT = 40;
export const CHART_STROKE_WIDTH = 2.5;
export const CHART_MARKER_RADIUS_PX = 5;
export const CHART_PADDING = 2;
export const CHART_FILL_OPACITY_TOP = 0.18;
export const CHART_BASELINE_RANGE_PERCENT = 35;

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
  cash: 0,
  deposit: 0,
  stock: 0,
};

export const GAME_ALLOCATION_ADJUSTMENT_PRIORITY = {
  cash: ["deposit", "stock"],
  deposit: ["stock", "cash"],
  stock: ["cash", "deposit"],
};

// 매수/매도 전 가격 관찰은 각각 4초 동안 네 번의 작은 변화로 보여준다.
export const GAME_TUTORIAL_OBSERVE_DURATION_MS = 4_000;
export const GAME_TUTORIAL_TICKS_PER_OBSERVE = 4;
export const GAME_TUTORIAL_TICK_INTERVAL_MS =
  GAME_TUTORIAL_OBSERVE_DURATION_MS / GAME_TUTORIAL_TICKS_PER_OBSERVE;

// 하락 → 저점(매수) → 상승(매도). 실제 정지 가격은 유지하고 중간 tick만 보강한다.
// 예금 해지는 시장 가격 조건을 기다리는 실습이 아니라서 별도 tick이 필요 없다.
export const GAME_TUTORIAL_CHART_PRICES = [
  11000, 10800, 10600, 10400, 10200, 10400, 10600, 10800, 11000,
];
export const GAME_TUTORIAL_LOW_TICK_INDEX = 4;
export const GAME_TUTORIAL_HIGH_TICK_INDEX = 8;

// 합계가 GAME_SEED_MONEY와 같아야 GamePortfolioPanel의 손익 계산이 맞음.
// 예금 해지 실습을 위해 시작 자산 일부를 예금으로 미리 넣어 둔다.
export const GAME_TUTORIAL_STARTING_ASSET = {
  cashAmount: GAME_SEED_MONEY - 2_000_000,
  depositAmount: 2_000_000,
  stockPrincipal: 0,
  stockQuantity: 0,
  averageStockPrice: 0,
};

// 화면 설명(STEP 1~9) 스포트라이트 대상. target은 각 컴포넌트의
// data-tutorial-target 속성값과 매칭된다.
export const GAME_TUTORIAL_EXPLAIN_STEPS = [
  {
    id: "market-index",
    target: "market-index",
    title: "종합지수",
    message: "먼저 이건 종합지수야!\n시장 전체가 지금 오르고 있는지,\n내려가고 있는지 보여주는 지표야.",
  },
  {
    id: "current-price",
    target: "current-price",
    title: "현재가",
    message: "이건 현재가야!\n이 주식을 지금 얼마에\n사고팔 수 있는지 보여주는 가격이야.",
  },
  {
    id: "total-asset",
    target: "total-asset",
    title: "현재 총자산",
    message: "여기는 현재 총자산이야!\n현금, 주식, 예·적금처럼\n내가 가진 자산을 모두 합친 금액이야.",
  },
  {
    id: "holding-stock",
    target: "holding-stock",
    title: "보유 종목",
    message: "여기서는 내가 가진 주식을 확인할 수 있어!\n얼마나 가지고 있는지,\n수익이 얼마나 났는지도 볼 수 있어.",
  },
  {
    id: "cash",
    target: "cash",
    title: "현금",
    message: "이건 지금 사용할 수 있는 현금이야!\n주식을 사거나 다른 금융 활동을 할 때\n이 돈을 사용하게 돼.",
  },
  {
    id: "deposit",
    target: "deposit",
    title: "예금",
    message: "여기서는 가입한 예·적금이 있는지 확인할 수 있어!\n예·적금은 일정 기간 돈을 맡기고\n이자를 받을 수 있어.",
  },
  {
    id: "buy-button",
    target: "buy-button",
    title: "매수하기",
    message: "주식을 사고 싶다면 매수하기!\n원하는 만큼 주식을 살 수 있어.",
  },
  {
    id: "sell-button",
    target: "sell-button",
    title: "매도하기",
    message: "가지고 있는 주식을 팔고 싶다면 매도하기!\n산 가격보다 높은 가격에 팔면\n수익을 얻을 수도 있어.",
  },
  {
    id: "cancel-deposit-button",
    target: "cancel-deposit-button",
    title: "예금 해지하기",
    message:
      "필요하면 예·적금은\n중간에 해지할 수 있어.\n\n하지만 약속한 기간보다 일찍 해지하면\n받을 수 있는 이자가 줄어들 수 있어!",
  },
];

// 화면 설명 이외 단계(인사·실습 안내·완료 등)의 꼬비 안내 문구.
export const GAME_TUTORIAL_MESSAGES = {
  // 시작 화면은 인사 문장을 제목처럼 크게 강조해서 보여준다(title/message 분리).
  greetingTitle: (nickname) => `안녕${nickname ? `, ${nickname}` : ""}!`,
  greetingBody: "난 꼬비라고 해!\n게임하는 방법을 하나씩 알려줄게!",
  skipTitle: "벌써 가려고?",
  skipBody:
    "아직 알려줄 내용이 남아 있어!\n그래도 원한다면 튜토리얼을 건너뛸 수 있어.",
  transition: "좋아!\n이제 화면은 다 알아봤어!\n\n이번엔 내가 알려주는 상황에서\n직접 선택해보자!",
  buyMarketNoticeTitle: "주식이 많이 내려갔네!",
  buyMarketNotice: "가격이 많이 내려갔어.\n지금 시장종합지수를 확인해보자!",
  buyActionTitle: "그럼 직접 매수해볼까?",
  buyAction: "매수하기를 눌러봐!",
  buySuccess: "좋아! 주식을 매수했어.\n이제 가격이 어떻게 변하는지 조금 더 지켜보자!",
  sellMarketNoticeTitle: "저점보다 많이 올랐어!",
  sellMarketNotice: "가격이 많이 올랐어.\n지금 시장종합지수를 확인해보자!",
  sellActionTitle: "그럼 직접 매도해볼까?",
  sellAction: "매도하기를 눌러봐!",
  sellSuccess: "잘했어!\n\n같은 주식이라도\n언제 사고 언제 파느냐에 따라\n결과가 달라질 수 있어.",
  depositIntro:
    "예·적금도 중도해지할 수 있어!\n\n예·적금은 만기까지 유지할 수도 있지만,\n중간에 해지하는 방법도 있어.",
  depositPrompt: "예금 해지 버튼을 눌러봐!",
  depositSuccess:
    "잘했어!\n\n예·적금은 중도해지도 가능하지만,\n만기와 중도해지의 차이를\n꼭 확인하고 선택해야 해!",
  complete:
    "튜토리얼 완료! 🎉\n\n이제 가격을 살펴보고\n주식을 사고팔고, 예금을 해지하는 흐름까지 모두 배웠어!\n\n게임에서는 네 선택에 따라\n자산과 금융성향이 달라질 거야.\n\n이제 진짜 시작해볼까?",
};

// PLAYING(관찰) 단계에서 꼬비가 보여주는 짧은 전환 문구.
// actionStepIndex(0: 매수 대기, 1: 매도 대기)에 대응한다. 시장 상황을 관찰하는
// 중립적인 순간이라 표정도 문구도 아쉬움 없이 담백하게 유지한다.
export const GAME_TUTORIAL_WATCH_MESSAGES = [
  "좋아!\n이제 가격이 어떻게 움직이는지\n잠깐 지켜보자 👀",
  "가격이 어떻게 변하는지\n조금 더 지켜보자.",
];

// 매수는 "주가가 뭔지" 설명하는 단계와 수량·금액을 확인하고 직접 눌러보는 행동
// 단계를 분리한다. 매도는 주가 개념을 매수에서 이미 배웠으므로 행동 단계 하나만.
export const GAME_TUTORIAL_BUY_GUIDE_STEPS = [
  {
    target: "buy-price",
    title: "주가가 뭐야?",
    message: "주가는 지금 이 주식을 사고팔 수 있는 가격이야!\n이 가격을 보고 얼마나 살지 정할 수 있어.",
    showPrev: false,
  },
  {
    target: "buy-order-card",
    interactionTarget: "buy-submit",
    title: "직접 매수해보자!",
    message: "이제 살 수량과 총 주문 금액을 확인하고,\n매수하기를 눌러 직접 매수해보자!",
    showPrev: false,
    allowInteraction: true,
  },
];

export const GAME_TUTORIAL_SELL_GUIDE_STEPS = [
  {
    target: "sell-order-card",
    interactionTarget: "sell-submit",
    title: "직접 매도해보자!",
    message: "팔 수량과 총 매도 금액, 손익을 확인하고,\n매도하기를 눌러 직접 매도해보자!",
    showPrev: false,
    allowInteraction: true,
  },
];

// 예금 해지 Popup은 바로 해지시키지 않고, 만기 유지와 중도해지의 차이를 하나씩
// 짚어준 뒤 마지막에만 실제 해지 버튼을 강조한다. expression은 단계별 감정에
// 맞춰 따로 지정한다 — "예금 해지"라는 이유만으로 시무룩을 남발하지 않는다.
export const GAME_TUTORIAL_DEPOSIT_GUIDE_STEPS = [
  {
    target: "deposit-not-matured",
    // Popup 상단부 대상이라 아래쪽을 우선하되, 공간이 부족하면 자동으로 위로 피한다.
    placement: "bottom",
    title: "아직 만기가 아니야",
    message:
      "먼저 여기 봐!\n이 예·적금은 아직 만기가 되지 않았어.\n\n예·적금은 약속한 기간까지 유지하면\n정해진 이자를 받을 수 있어.",
    expression: "default",
    showPrev: false,
  },
  {
    target: "deposit-maturity-amount",
    title: "만기까지 유지하면",
    message:
      "만기까지 유지하면\n여기 표시된 금액을 받을 수 있어!\n\n원금에 약속된 이자가 더해진\n예상 금액이야.",
    expression: "happy",
    showPrev: false,
  },
  {
    target: "deposit-cancel-amount",
    title: "지금 해지하면",
    message:
      "반대로 지금 해지하면\n받을 수 있는 금액은 여기서 확인할 수 있어.\n\n만기 전에 해지하면\n받을 수 있는 이자가 줄어들 수 있어.",
    expression: "sad",
    showPrev: false,
  },
  {
    target: "deposit-warning-note",
    title: "예·적금 비중이 달라져",
    message:
      "예·적금을 해지하면\n묶여 있던 돈이 현금으로 바뀌어.\n\n그래서 내 자산의\n예·적금 비중도 달라질 수 있어!",
    expression: "default",
    showPrev: false,
  },
  {
    target: "deposit-confirm",
    title: "직접 해지해보자!",
    message: "이제 차이를 확인했지?\n\n예금 해지하기를 눌러\n직접 해지해보자!",
    expression: "happy",
    showPrev: false,
    allowInteraction: true,
  },
];
