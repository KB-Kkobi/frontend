<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { fetchMyInfo } from '@/api/authApi';
import BackButton from '@/components/common/BackButton.vue';
import BaseCard from '@/components/common/BaseCard.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import PageContainer from '@/components/common/PageContainer.vue';
import GameBuyBottomSheet from '@/components/game/GameBuyBottomSheet.vue';
import GameDepositCancelPopup from '@/components/game/GameDepositCancelPopup.vue';
import GamePortfolioPanel from '@/components/game/GamePortfolioPanel.vue';
import GameSellBottomSheet from '@/components/game/GameSellBottomSheet.vue';
import GameTutorialOverlay from '@/components/game/GameTutorialOverlay.vue';
import MarketIndexCard from '@/components/game/MarketIndexCard.vue';
import kkobiCheer from '@/assets/images/tutorial/kkobi-cheer.png';
import kkobiGreeting from '@/assets/images/tutorial/kkobi-greeting.png';
import kkobiGuide from '@/assets/images/tutorial/kkobi-guide.png';
import kkobiNeutral from '@/assets/images/tutorial/kkobi-neutral.png';
import kkobiProud from '@/assets/images/tutorial/kkobi-proud.png';
import kkobiSad from '@/assets/images/tutorial/kkobi-sad.png';
import {
  GAME_DEPOSIT_MONTHS,
  GAME_TUTORIAL_BUY_GUIDE_STEPS,
  GAME_TUTORIAL_CHART_PRICES,
  GAME_TUTORIAL_DEPOSIT_GUIDE_STEPS,
  GAME_TUTORIAL_EXPLAIN_STEPS,
  GAME_TUTORIAL_HIGH_TICK_INDEX,
  GAME_TUTORIAL_LOW_TICK_INDEX,
  GAME_TUTORIAL_MESSAGES,
  GAME_TUTORIAL_SELL_GUIDE_STEPS,
  GAME_TUTORIAL_STARTING_ASSET,
  GAME_TUTORIAL_TICK_INTERVAL_MS,
  GAME_TUTORIAL_WATCH_MESSAGES,
} from '@/constants/game';
import { useGameTick } from '@/composables/useGameTick';

// 튜토리얼 진행 단계. EXPLAIN(화면 설명)·PLAYING(차트 관찰 안내) 외에는
// 모두 GameTutorialOverlay 한 장으로 표현된다. *_GUIDE는 실제 BottomSheet/Popup이
// 열린 상태에서 그 내부 요소를 짚어주는 미니 가이드 단계.
const TUTORIAL_PHASE = Object.freeze({
  GREETING: 'greeting',
  EXPLAIN: 'explain',
  TRANSITION: 'transition',
  PLAYING: 'playing',
  BUY_MARKET_NOTICE: 'buy-market-notice',
  BUY_PROMPT: 'buy-prompt',
  BUY_GUIDE: 'buy-guide',
  BUY_SUCCESS: 'buy-success',
  SELL_MARKET_NOTICE: 'sell-market-notice',
  SELL_PROMPT: 'sell-prompt',
  SELL_GUIDE: 'sell-guide',
  SELL_SUCCESS: 'sell-success',
  DEPOSIT_INTRO: 'deposit-intro',
  DEPOSIT_PROMPT: 'deposit-prompt',
  DEPOSIT_GUIDE: 'deposit-guide',
  DEPOSIT_SUCCESS: 'deposit-success',
  COMPLETE: 'complete',
});

const GUIDE_STEPS_BY_PHASE = {
  [TUTORIAL_PHASE.BUY_GUIDE]: GAME_TUTORIAL_BUY_GUIDE_STEPS,
  [TUTORIAL_PHASE.SELL_GUIDE]: GAME_TUTORIAL_SELL_GUIDE_STEPS,
  [TUTORIAL_PHASE.DEPOSIT_GUIDE]: GAME_TUTORIAL_DEPOSIT_GUIDE_STEPS,
};

// 단계는 표정의 의미만 선택하고 실제 에셋 연결은 이 맵에서 관리한다.
// 이후 새 표정이 추가되어도 시나리오나 오버레이 구조를 바꾸지 않아도 된다.
const KKOBI_EXPRESSION_IMAGE = Object.freeze({
  bright: kkobiGreeting,
  default: kkobiGuide,
  curious: kkobiNeutral,
  happy: kkobiProud,
  celebrate: kkobiCheer,
  serious: kkobiGuide,
  sad: kkobiSad,
});

// 원본 이미지의 투명 여백 차이를 보정해 표정이 바뀌어도 실제 캐릭터 크기가
// 비슷하게 보이도록 한다. 공통 래퍼 확대로 전체 크기도 기존보다 약 14% 키운다.
const KKOBI_EXPRESSION_SCALE = Object.freeze({
  bright: 1.04,
  default: 1.1,
  curious: 1,
  happy: 1,
  celebrate: 1.06,
  serious: 1.1,
  sad: 1.05,
});

// PLAYING(관찰) 단계는 손실이나 실패가 아니라 시장 변화를 지켜보는 중립적인
// 순간이라 표정도 담백하게 유지한다(시무룩 금지).
const PLAYING_WATCH_EXPRESSIONS = ['curious', 'curious'];

// 가격 관찰·매수 전·매도 전 시장 안내는 같은 범위와 배치를 공유한다.
// 개별 화면 설명용 market-index/current-price target은 그대로 두고, 두 영역을
// 감싼 target 하나를 사용해 여러 Spotlight 박스처럼 보이지 않게 한다.
const MARKET_PRICE_SPOTLIGHT = Object.freeze({
  target: 'market-price-info',
  placement: 'bottom',
});

const router = useRouter();
const {
  currentTick,
  visibleTicks,
  totalTickCount,
  priceMin,
  priceMax,
  start,
  pause,
  resume,
} = useGameTick();

const basePrice = GAME_TUTORIAL_CHART_PRICES[0];
const tutorialScenario = {
  tickIntervalMs: GAME_TUTORIAL_TICK_INTERVAL_MS,
  ticks: GAME_TUTORIAL_CHART_PRICES.map((price, index) => ({
    tick: index,
    month: index + 1,
    marketIndex: price,
    price,
    changeRate: ((price - basePrice) / basePrice) * 100,
  })),
};

const phase = ref(TUTORIAL_PHASE.GREETING);
const explainStepIndex = ref(0);
const guideStepIndex = ref(0);
const actionStepIndex = ref(0); // 0: 매수 실습, 1: 매도 실습
const nickname = ref('');
const cashAmount = ref(GAME_TUTORIAL_STARTING_ASSET.cashAmount);
const depositAmount = ref(GAME_TUTORIAL_STARTING_ASSET.depositAmount);
const depositStatus = ref('ACTIVE');
const stockQuantity = ref(GAME_TUTORIAL_STARTING_ASSET.stockQuantity);
const averageStockPrice = ref(GAME_TUTORIAL_STARTING_ASSET.averageStockPrice);
const stockPrincipal = ref(GAME_TUTORIAL_STARTING_ASSET.stockPrincipal);
const isBuySheetOpen = ref(false);
const isSellSheetOpen = ref(false);
const isDepositCancelPopupOpen = ref(false);
const isDepositConfirmationOpen = ref(false);
const isSkipConfirmationOpen = ref(false);
const shouldResumeAfterSkipCancel = ref(false);
const isTutorialExiting = ref(false);
const overlayRef = ref(null);
const sheetLiftPx = computed(() => overlayRef.value?.sheetLiftPx ?? 0);

const prices = computed(() => visibleTicks.value.map((tick) => tick.price));

const explainStep = computed(() => GAME_TUTORIAL_EXPLAIN_STEPS[explainStepIndex.value]);
const isLastExplainStep = computed(
  () => explainStepIndex.value === GAME_TUTORIAL_EXPLAIN_STEPS.length - 1,
);

const currentGuideSteps = computed(() => GUIDE_STEPS_BY_PHASE[phase.value] ?? null);
const currentGuideStep = computed(() => currentGuideSteps.value?.[guideStepIndex.value] ?? null);
const isLastGuideStep = computed(
  () =>
    !currentGuideSteps.value ||
    guideStepIndex.value === currentGuideSteps.value.length - 1,
);

// 실제 매수/매도/예금 해지 버튼은 각 프롬프트 단계에서만 진입 트리거로 열어준다.
const buyDisabled = computed(() => phase.value !== TUTORIAL_PHASE.BUY_PROMPT);
const sellDisabled = computed(() => phase.value !== TUTORIAL_PHASE.SELL_PROMPT);
const cancelDepositDisabled = computed(
  () => phase.value !== TUTORIAL_PHASE.DEPOSIT_PROMPT,
);

const totalAssetAmount = computed(
  () =>
    cashAmount.value +
    depositAmount.value +
    (currentTick.value?.price ?? 0) * stockQuantity.value,
);
const depositRatio = computed(() => {
  if (totalAssetAmount.value === 0) return 0;
  return (depositAmount.value / totalAssetAmount.value) * 100;
});

// PLAYING도 항상 (가벼운) 안내 콘텐츠를 갖기 때문에 사실상 튜토리얼 내내 true다.
// 즉 오버레이 컴포넌트 자체가 사라졌다 다시 나타나는 구간이 없다.
const isOverlayVisible = computed(() => !!overlayContent.value);

// 단계별 GameTutorialOverlay props를 한 곳에서 계산한다(거대한 template 분기 방지).
const overlayContent = computed(() => {
  switch (phase.value) {
    case TUTORIAL_PHASE.GREETING:
      return {
        expression: 'bright',
        variant: 'start',
        title: GAME_TUTORIAL_MESSAGES.greetingTitle(nickname.value),
        message: GAME_TUTORIAL_MESSAGES.greetingBody,
        confirmLabel: '시작하기',
      };
    case TUTORIAL_PHASE.EXPLAIN:
      return {
        expression: 'default',
        title: explainStep.value.title,
        message: explainStep.value.message,
        target: explainStep.value.target,
        showPrev: true,
        nextLabel: '다음',
      };
    case TUTORIAL_PHASE.TRANSITION:
      return {
        expression: 'celebrate',
        message: GAME_TUTORIAL_MESSAGES.transition,
        showPrev: true,
        confirmLabel: '해볼래!',
        centerDock: true,
      };
    // 다음 행동 조건(저점/고점/예금 tick)을 기다리는 동안 보여주는 가벼운 관찰 상태.
    // 안내 UI가 완전히 사라지는 빈 화면 구간을 만들지 않기 위한 전환 단계.
    case TUTORIAL_PHASE.PLAYING:
      return {
        expression: PLAYING_WATCH_EXPRESSIONS[actionStepIndex.value] ?? 'curious',
        message: GAME_TUTORIAL_WATCH_MESSAGES[actionStepIndex.value] ?? '',
        ...MARKET_PRICE_SPOTLIGHT,
        lightweight: true,
        spotlightVariant: 'observe',
      };
    // 가격 하락이라는 "시장 상황"을 먼저 보여주고, 실제 매수 행동 유도는
    // 별도 단계(BUY_PROMPT)로 분리한다 — 아직 매수 버튼을 설명하는 게
    // 아니므로 하단 자산 카드를 강조하면 어색하다.
    case TUTORIAL_PHASE.BUY_MARKET_NOTICE:
      return {
        expression: 'default',
        title: GAME_TUTORIAL_MESSAGES.buyMarketNoticeTitle,
        message: GAME_TUTORIAL_MESSAGES.buyMarketNotice,
        ...MARKET_PRICE_SPOTLIGHT,
        nextLabel: '다음',
      };
    case TUTORIAL_PHASE.BUY_PROMPT:
      return {
        expression: 'default',
        title: GAME_TUTORIAL_MESSAGES.buyActionTitle,
        message: GAME_TUTORIAL_MESSAGES.buyAction,
        target: 'buy-button',
        allowInteraction: true,
      };
    case TUTORIAL_PHASE.BUY_GUIDE:
      return {
        expression: 'default',
        title: currentGuideStep.value?.title ?? '',
        message: currentGuideStep.value?.message ?? '',
        target: currentGuideStep.value?.target ?? null,
        interactionTarget: currentGuideStep.value?.interactionTarget ?? null,
        placement: currentGuideStep.value?.placement ?? 'auto',
        showPrev: currentGuideStep.value?.showPrev ?? false,
        nextLabel: isLastGuideStep.value ? '' : '다음',
        allowInteraction: currentGuideStep.value?.allowInteraction ?? false,
      };
    case TUTORIAL_PHASE.BUY_SUCCESS:
      return {
        expression: 'happy',
        message: GAME_TUTORIAL_MESSAGES.buySuccess,
        confirmLabel: '확인',
      };
    case TUTORIAL_PHASE.SELL_MARKET_NOTICE:
      return {
        expression: 'default',
        title: GAME_TUTORIAL_MESSAGES.sellMarketNoticeTitle,
        message: GAME_TUTORIAL_MESSAGES.sellMarketNotice,
        ...MARKET_PRICE_SPOTLIGHT,
        nextLabel: '다음',
      };
    case TUTORIAL_PHASE.SELL_PROMPT:
      return {
        expression: 'default',
        title: GAME_TUTORIAL_MESSAGES.sellActionTitle,
        message: GAME_TUTORIAL_MESSAGES.sellAction,
        target: 'sell-button',
        allowInteraction: true,
      };
    case TUTORIAL_PHASE.SELL_GUIDE:
      return {
        expression: 'default',
        title: currentGuideStep.value?.title ?? '',
        message: currentGuideStep.value?.message ?? '',
        target: currentGuideStep.value?.target ?? null,
        interactionTarget: currentGuideStep.value?.interactionTarget ?? null,
        placement: currentGuideStep.value?.placement ?? 'auto',
        showPrev: currentGuideStep.value?.showPrev ?? false,
        nextLabel: isLastGuideStep.value ? '' : '다음',
        allowInteraction: currentGuideStep.value?.allowInteraction ?? false,
      };
    case TUTORIAL_PHASE.SELL_SUCCESS:
      return {
        expression: 'happy',
        message: GAME_TUTORIAL_MESSAGES.sellSuccess,
        confirmLabel: '확인',
      };
    case TUTORIAL_PHASE.DEPOSIT_INTRO:
      return {
        expression: 'default',
        message: GAME_TUTORIAL_MESSAGES.depositIntro,
        confirmLabel: '다음',
        centerDock: true,
      };
    case TUTORIAL_PHASE.DEPOSIT_PROMPT:
      return {
        expression: 'default',
        message: GAME_TUTORIAL_MESSAGES.depositPrompt,
        target: 'cancel-deposit-button',
        allowInteraction: true,
        centerDock: true,
      };
    case TUTORIAL_PHASE.DEPOSIT_GUIDE:
      return {
        expression: currentGuideStep.value?.expression ?? 'default',
        title: currentGuideStep.value?.title ?? '',
        message: currentGuideStep.value?.message ?? '',
        target: currentGuideStep.value?.target ?? null,
        interactionTarget: currentGuideStep.value?.interactionTarget ?? null,
        placement: currentGuideStep.value?.placement ?? 'auto',
        showPrev: currentGuideStep.value?.showPrev ?? false,
        nextLabel: isLastGuideStep.value ? '' : '다음',
        allowInteraction: currentGuideStep.value?.allowInteraction ?? false,
      };
    case TUTORIAL_PHASE.DEPOSIT_SUCCESS:
      return {
        expression: 'happy',
        message: GAME_TUTORIAL_MESSAGES.depositSuccess,
        confirmLabel: '확인',
      };
    case TUTORIAL_PHASE.COMPLETE:
      return {
        expression: 'celebrate',
        message: GAME_TUTORIAL_MESSAGES.complete,
        showPrev: true,
        confirmLabel: '튜토리얼 완료',
      };
    default:
      return null;
  }
});

const overlayImage = computed(
  () => KKOBI_EXPRESSION_IMAGE[overlayContent.value?.expression] ?? kkobiGuide,
);
const overlayImageScale = computed(
  () => KKOBI_EXPRESSION_SCALE[overlayContent.value?.expression] ?? 1,
);

function finishTutorialNavigation() {
  router.replace({ name: 'game-start' });
}

function handleTutorialHistoryBack() {
  if (isTutorialExiting.value) return;
  window.history.pushState(
    { ...window.history.state, tutorialGuard: true },
    '',
    window.location.href,
  );
}

function completeTutorial() {
  isTutorialExiting.value = true;
  window.removeEventListener('popstate', handleTutorialHistoryBack);

  if (window.history.state?.tutorialGuard) {
    window.addEventListener('popstate', finishTutorialNavigation, { once: true });
    window.history.back();
    return;
  }

  finishTutorialNavigation();
}

function handleRequestSkipTutorial() {
  shouldResumeAfterSkipCancel.value = phase.value === TUTORIAL_PHASE.PLAYING;
  if (shouldResumeAfterSkipCancel.value) pause();
  overlayRef.value?.clearSpotlight();
  isSkipConfirmationOpen.value = true;
}

function handleCancelSkipTutorial() {
  if (
    shouldResumeAfterSkipCancel.value &&
    phase.value === TUTORIAL_PHASE.PLAYING
  ) {
    resume();
  }
  shouldResumeAfterSkipCancel.value = false;
}

function handleSkipTutorial() {
  shouldResumeAfterSkipCancel.value = false;
  completeTutorial();
}

function handleOpenBuySheet() {
  overlayRef.value?.clearSpotlight();
  isBuySheetOpen.value = true;
  guideStepIndex.value = 0;
  phase.value = TUTORIAL_PHASE.BUY_GUIDE;
}

function handleOpenSellSheet() {
  overlayRef.value?.clearSpotlight();
  isSellSheetOpen.value = true;
  guideStepIndex.value = 0;
  phase.value = TUTORIAL_PHASE.SELL_GUIDE;
}

function handleOpenDepositCancelPopup() {
  overlayRef.value?.clearSpotlight();
  isDepositCancelPopupOpen.value = true;
  guideStepIndex.value = 0;
  phase.value = TUTORIAL_PHASE.DEPOSIT_GUIDE;
}

function handleBuyStock({ quantity, orderAmount }) {
  const previousQuantity = stockQuantity.value;
  const nextQuantity = previousQuantity + quantity;
  averageStockPrice.value =
    nextQuantity === 0
      ? 0
      : (averageStockPrice.value * previousQuantity + orderAmount) / nextQuantity;
  stockQuantity.value = nextQuantity;
  stockPrincipal.value += orderAmount;
  cashAmount.value -= orderAmount;
  overlayRef.value?.clearSpotlight();
  isBuySheetOpen.value = false;
  actionStepIndex.value = 1;
  phase.value = TUTORIAL_PHASE.BUY_SUCCESS;
}

function handleSellStock({ quantity, saleAmount }) {
  const isFullSale = quantity === stockQuantity.value;
  const soldStockPrincipal = Math.round(averageStockPrice.value * quantity);
  stockPrincipal.value = isFullSale
    ? 0
    : Math.max(stockPrincipal.value - soldStockPrincipal, 0);
  stockQuantity.value -= quantity;
  if (stockQuantity.value === 0) averageStockPrice.value = 0;
  cashAmount.value += saleAmount;
  overlayRef.value?.clearSpotlight();
  isSellSheetOpen.value = false;
  phase.value = TUTORIAL_PHASE.SELL_SUCCESS;
}

// 실제 해지 버튼을 눌러도 바로 해지하지 않고 공통 확인 모달을 먼저 띄운다.
// GameTutorialOverlay는 이 동안 통째로 언마운트되므로(z-index 경합 방지),
// 다시 마운트될 때 자연히 깨끗한 상태로 재측정된다 — 별도 복원 로직이 필요 없다.
function handleRequestCancelDeposit() {
  overlayRef.value?.clearSpotlight();
  isDepositConfirmationOpen.value = true;
}

function handleCancelDeposit() {
  cashAmount.value += depositAmount.value;
  depositAmount.value = 0;
  depositStatus.value = 'CANCELLED';
  isDepositCancelPopupOpen.value = false;
  phase.value = TUTORIAL_PHASE.DEPOSIT_SUCCESS;
}

function handleExplainPrev() {
  if (explainStepIndex.value === 0) {
    phase.value = TUTORIAL_PHASE.GREETING;
    return;
  }
  explainStepIndex.value -= 1;
}

function handleExplainNext() {
  if (isLastExplainStep.value) {
    phase.value = TUTORIAL_PHASE.TRANSITION;
    return;
  }
  explainStepIndex.value += 1;
}

// 매수/매도 BottomSheet 내부 미니 가이드의 "다음".
// 마지막 항목은 다음 버튼이 없고 실제 버튼 클릭으로만 진행된다.
function handleGuideNext() {
  if (isLastGuideStep.value) return;
  guideStepIndex.value += 1;
}

function handleOverlayPrev() {
  if (phase.value === TUTORIAL_PHASE.EXPLAIN) {
    handleExplainPrev();
    return;
  }
  if (phase.value === TUTORIAL_PHASE.TRANSITION) {
    explainStepIndex.value = GAME_TUTORIAL_EXPLAIN_STEPS.length - 1;
    phase.value = TUTORIAL_PHASE.EXPLAIN;
    return;
  }
  if (phase.value === TUTORIAL_PHASE.COMPLETE) {
    phase.value = TUTORIAL_PHASE.DEPOSIT_SUCCESS;
  }
}

function handleOverlayNext() {
  if (phase.value === TUTORIAL_PHASE.EXPLAIN) {
    handleExplainNext();
    return;
  }
  if (phase.value === TUTORIAL_PHASE.BUY_MARKET_NOTICE) {
    overlayRef.value?.clearSpotlight();
    phase.value = TUTORIAL_PHASE.BUY_PROMPT;
    return;
  }
  if (phase.value === TUTORIAL_PHASE.SELL_MARKET_NOTICE) {
    overlayRef.value?.clearSpotlight();
    phase.value = TUTORIAL_PHASE.SELL_PROMPT;
    return;
  }
  handleGuideNext();
}

// 확인 버튼 한 개짜리 단계(인사·전환·성공 안내·완료 등)는 여기서 다음 단계로 넘긴다.
function handleOverlayConfirm() {
  if (phase.value === TUTORIAL_PHASE.GREETING) {
    phase.value = TUTORIAL_PHASE.EXPLAIN;
    explainStepIndex.value = 0;
    return;
  }
  if (phase.value === TUTORIAL_PHASE.TRANSITION) {
    phase.value = TUTORIAL_PHASE.PLAYING;
    resume();
    return;
  }
  if (phase.value === TUTORIAL_PHASE.BUY_SUCCESS) {
    phase.value = TUTORIAL_PHASE.PLAYING;
    resume();
    return;
  }
  if (phase.value === TUTORIAL_PHASE.SELL_SUCCESS) {
    // 예금 해지는 시장 tick을 기다리는 실습이 아니라서 관찰(PLAYING) 단계 없이
    // 바로 예금 소개로 넘어간다 — 여기서 로딩/대기 연출이 생기지 않도록 한다.
    phase.value = TUTORIAL_PHASE.DEPOSIT_INTRO;
    return;
  }
  if (phase.value === TUTORIAL_PHASE.DEPOSIT_INTRO) {
    phase.value = TUTORIAL_PHASE.DEPOSIT_PROMPT;
    return;
  }
  if (phase.value === TUTORIAL_PHASE.DEPOSIT_SUCCESS) {
    phase.value = TUTORIAL_PHASE.COMPLETE;
    return;
  }
  if (phase.value === TUTORIAL_PHASE.COMPLETE) {
    completeTutorial();
  }
}

watch(currentTick, (tick) => {
  if (!tick) return;
  if (actionStepIndex.value === 0 && tick.tick === GAME_TUTORIAL_LOW_TICK_INDEX) {
    pause();
    phase.value = TUTORIAL_PHASE.BUY_MARKET_NOTICE;
    return;
  }
  if (actionStepIndex.value === 1 && tick.tick === GAME_TUTORIAL_HIGH_TICK_INDEX) {
    pause();
    phase.value = TUTORIAL_PHASE.SELL_MARKET_NOTICE;
    return;
  }
});

// 튜토리얼 도중 브라우저/서비스 뒤로가기로 단계 상태가 무너지는 것을 막는다.
// 완료 버튼을 통한 정상 이탈만 허용한다.
onBeforeRouteLeave(() => isTutorialExiting.value);

onMounted(async () => {
  window.history.pushState(
    { ...window.history.state, tutorialGuard: true },
    '',
    window.location.href,
  );
  window.addEventListener('popstate', handleTutorialHistoryBack);

  // 인사·화면 설명 단계에서는 배경 화면만 정지된 상태로 보여준다.
  start(tutorialScenario);
  pause();

  try {
    const myInfo = await fetchMyInfo();
    nickname.value = myInfo?.nickname ?? '';
  } catch {
    nickname.value = '';
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handleTutorialHistoryBack);
  window.removeEventListener('popstate', finishTutorialNavigation);
});
</script>

<template>
  <PageContainer compact>
    <div class="flex flex-col gap-4 py-6">
      <div class="flex items-center">
        <BackButton disabled />
      </div>

      <MarketIndexCard
        :current-tick="currentTick"
        :prices="prices"
        :total-ticks="totalTickCount"
        :price-min="priceMin"
        :price-max="priceMax"
        compact
      />

      <BaseCard color="white" data-tutorial-target="asset-panel">
        <GamePortfolioPanel
          :stock-quantity="stockQuantity"
          :average-stock-price="averageStockPrice"
          :stock-principal="stockPrincipal"
          :current-stock-price="currentTick?.price"
          :cash-amount="cashAmount"
          :deposit-amount="depositAmount"
          :deposit-status="depositStatus"
          :remaining-deposit-days="GAME_DEPOSIT_MONTHS * 30"
          :buy-disabled="buyDisabled"
          :sell-disabled="sellDisabled"
          :cancel-deposit-disabled="cancelDepositDisabled"
          @buy="handleOpenBuySheet"
          @sell="handleOpenSellSheet"
          @cancel-deposit="handleOpenDepositCancelPopup"
        />
      </BaseCard>

      <GameBuyBottomSheet
        v-model="isBuySheetOpen"
        :current-price="currentTick?.price"
        :available-amount="cashAmount"
        :dismissible="false"
        :lift-px="sheetLiftPx"
        @submit="handleBuyStock"
      />
      <GameSellBottomSheet
        v-model="isSellSheetOpen"
        :current-price="currentTick?.price"
        :average-price="averageStockPrice"
        :available-quantity="stockQuantity"
        :dismissible="false"
        :lift-px="sheetLiftPx"
        @submit="handleSellStock"
      />
      <GameDepositCancelPopup
        v-model="isDepositCancelPopupOpen"
        variant="tutorial"
        :deposit-amount="depositAmount"
        :deposit-ratio="depositRatio"
        :dismissible="false"
        :show-backdrop="!isDepositConfirmationOpen"
        @confirm="handleRequestCancelDeposit"
      />

    </div>
  </PageContainer>

  <!-- 확인 모달이 열려 있는 동안에는 튜토리얼 Overlay 자체를 언마운트한다.
       BaseModal(z-50)이 Overlay(z-[60]) 아래 깔려 클릭이 막히는 것을 막고,
       모달이 닫히면 Overlay가 새로 마운트되며 깨끗한 상태로 다시 측정된다. -->
  <GameTutorialOverlay
    v-if="overlayContent && !isDepositConfirmationOpen && !isSkipConfirmationOpen"
    ref="overlayRef"
    :visible="isOverlayVisible"
    :image="overlayImage"
    :image-scale="overlayImageScale"
    :variant="overlayContent.variant || 'compact'"
    :title="overlayContent.title"
    :message="overlayContent.message"
    :target="overlayContent.target"
    :interaction-target="overlayContent.interactionTarget"
    skip-label="건너뛰기"
    :placement="overlayContent.placement"
    :show-prev="overlayContent.showPrev"
    :prev-disabled="overlayContent.prevDisabled"
    :next-label="overlayContent.nextLabel"
    :confirm-label="overlayContent.confirmLabel"
    :lightweight="overlayContent.lightweight"
    :center-dock="overlayContent.centerDock"
    :focus-pulse="overlayContent.focusPulse"
    :pulse-key="overlayContent.pulseKey"
    :spotlight-variant="overlayContent.spotlightVariant"
    :allow-interaction="overlayContent.allowInteraction"
    @prev="handleOverlayPrev"
    @next="handleOverlayNext"
    @confirm="handleOverlayConfirm"
    @skip="handleRequestSkipTutorial"
  />

  <BaseModal
    v-model="isSkipConfirmationOpen"
    message="튜토리얼을 건너뛰시겠습니까?"
    confirm-text="건너뛰기"
    cancel-text="계속 진행하기"
    @confirm="handleSkipTutorial"
    @cancel="handleCancelSkipTutorial"
  />

  <BaseModal
    v-model="isDepositConfirmationOpen"
    message="정말 예·적금을 해지하시겠어요?"
    confirm-text="해지하기"
    cancel-text="계속 유지하기"
    cancel-disabled
    tone="tutorial-confirm"
    @confirm="handleCancelDeposit"
  >
    <template #content>
      <p class="text-center text-caption text-muted">
        중도해지 후에는 되돌릴 수 없어요.
      </p>
    </template>
  </BaseModal>
</template>
