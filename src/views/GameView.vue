<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { completeGame, fetchScenario, saveGameAction } from "@/api/gameApi";
import { ApiError } from "@/api/http";
import BaseCard from "@/components/common/BaseCard.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import GameBuyBottomSheet from "@/components/game/GameBuyBottomSheet.vue";
import GameCompletionPopup from "@/components/game/GameCompletionPopup.vue";
import GameDepositCancelPopup from "@/components/game/GameDepositCancelPopup.vue";
import GameDepositMaturityPopup from "@/components/game/GameDepositMaturityPopup.vue";
import GameEventPopup from "@/components/game/GameEventPopup.vue";
import GamePortfolioPanel from "@/components/game/GamePortfolioPanel.vue";
import GameSellBottomSheet from "@/components/game/GameSellBottomSheet.vue";
import MarketIndexCard from "@/components/game/MarketIndexCard.vue";
import {
  DEFAULT_SCENARIO_ID,
  GAME_DEPOSIT_MONTHS,
} from "@/constants/game";
import { useGameTick } from "@/composables/useGameTick";
import {
  readGameCompletionSession,
  readGameStartSession,
  saveGameCompletionSession,
  saveGameStartSession,
} from "@/utils/gameStorage";

const {
  currentTick,
  visibleTicks,
  totalTickCount,
  priceMin,
  priceMax,
  start,
  restore,
  pause,
  resume,
} = useGameTick();
const router = useRouter();

const isLoading = ref(true);
const errorMessage = ref("");
const eventsByTick = ref(new Map());
const shownEventTicks = ref(new Set());
const activeEvent = ref(null);
const bannerEvent = ref(null);
const isBuySheetOpen = ref(false);
const isSellSheetOpen = ref(false);
const isDepositCancelPopupOpen = ref(false);
const isDepositMaturityPopupOpen = ref(false);
const isGameCompletionPopupOpen = ref(false);
const hasResolvedDepositMaturity = ref(false);
const isCompletingGame = ref(false);
const gameCompletionErrorMessage = ref("");
const isBuying = ref(false);
const isSelling = ref(false);
const isCancellingDeposit = ref(false);
const buyErrorMessage = ref("");
const sellErrorMessage = ref("");
const depositCancelErrorMessage = ref("");
const gameStart = ref(readGameStartSession());
const initialStockPrice = ref(0);
const averageStockPrice = ref(0);
const stockQuantity = ref(0);
const finalGameTick = ref(null);
const isRestoredCompletedGame = ref(
  readGameCompletionSession() || gameStart.value?.isCompleted === true,
);

const prices = computed(() => visibleTicks.value.map((tick) => tick.price));
const stockAmount = computed(() => gameStart.value?.stockAmount ?? 0);
const cashAmount = computed(() => gameStart.value?.cashAmount ?? 0);
const depositAmount = computed(() => gameStart.value?.depositAmount ?? 0);
const totalAssetAmount = computed(
  () =>
    cashAmount.value +
    depositAmount.value +
    ((currentTick.value?.price ?? 0) * stockQuantity.value),
);
const depositRatio = computed(() => {
  if (totalAssetAmount.value === 0) return 0;
  return (depositAmount.value / totalAssetAmount.value) * 100;
});
const isGameFinished = computed(
  () =>
    finalGameTick.value !== null &&
    currentTick.value?.tick === finalGameTick.value,
);
const remainingDepositDays = computed(() => {
  const elapsedMonths = Math.max((currentTick.value?.month ?? 1) - 1, 0);
  return Math.max(0, (GAME_DEPOSIT_MONTHS - elapsedMonths) * 30);
});

function buildEventsByTick(events) {
  return new Map(
    events.map(({ tick, tag, tagTone, summary, description }) => [
      tick,
      { tag, tagTone, summary, description },
    ]),
  );
}

async function loadScenario() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const scenario = await fetchScenario(DEFAULT_SCENARIO_ID);
    initialStockPrice.value = scenario.ticks[0]?.price ?? scenario.basePrice;
    averageStockPrice.value = gameStart.value?.averageStockPrice
      ?? initialStockPrice.value;
    stockQuantity.value = gameStart.value?.stockQuantity
      ?? (initialStockPrice.value
        ? Math.floor(stockAmount.value / initialStockPrice.value)
        : 0);
    finalGameTick.value = scenario.ticks.at(-1)?.tick ?? null;
    eventsByTick.value = buildEventsByTick(scenario.events);
    if (isRestoredCompletedGame.value) {
      shownEventTicks.value = new Set(scenario.events.map(({ tick }) => tick));
      restore(scenario, scenario.ticks.length - 1);
      hasResolvedDepositMaturity.value = true;
      isGameCompletionPopupOpen.value = true;
      return;
    }
    start(scenario);
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError
        ? error.message
        : "시나리오를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isLoading.value = false;
  }
}

function handleCloseEvent() {
  bannerEvent.value = activeEvent.value;
  activeEvent.value = null;
  if (openDepositMaturityPopup()) return;
  if (isGameFinished.value) {
    requestGameCompletion();
    return;
  }
  resume();
}

function handleOpenBuySheet() {
  if (isGameFinished.value) return;
  buyErrorMessage.value = "";
  isBuySheetOpen.value = true;
}

function handleOpenSellSheet() {
  if (isGameFinished.value) return;
  sellErrorMessage.value = "";
  isSellSheetOpen.value = true;
}

function handleOpenDepositCancelPopup() {
  depositCancelErrorMessage.value = "";
  isDepositCancelPopupOpen.value = true;
}

function openDepositMaturityPopup() {
  if (
    hasResolvedDepositMaturity.value ||
    activeEvent.value ||
    currentTick.value?.tick !== finalGameTick.value ||
    gameStart.value?.depositStatus !== "ACTIVE" ||
    depositAmount.value <= 0
  ) return false;

  isDepositMaturityPopupOpen.value = true;
  pause();
  return true;
}

function handleConfirmDepositMaturity(maturityAmount) {
  hasResolvedDepositMaturity.value = true;
  gameStart.value = {
    ...gameStart.value,
    depositAmount: maturityAmount,
    depositStatus: "MATURED",
  };
  saveGameStartSession(gameStart.value);
  isDepositMaturityPopupOpen.value = false;
  requestGameCompletion();
}

async function requestGameCompletion() {
  if (isCompletingGame.value) return;

  isGameCompletionPopupOpen.value = true;
  isCompletingGame.value = true;
  gameCompletionErrorMessage.value = "";

  try {
    await completeGame();
    saveGameCompletionSession();
    gameStart.value = {
      ...gameStart.value,
      isCompleted: true,
    };
    saveGameStartSession(gameStart.value);
    isRestoredCompletedGame.value = true;
  } catch (error) {
    gameCompletionErrorMessage.value = error instanceof ApiError
      ? error.message
      : "게임 결과 저장에 실패했습니다. 다시 시도해 주세요.";
  } finally {
    isCompletingGame.value = false;
  }
}

function handleViewAssessmentResult() {
  saveGameCompletionSession();
  router.push({ name: "assessment-result" });
}

async function handleBuyStock({ quantity, orderAmount }) {
  if (isBuying.value || !currentTick.value || !gameStart.value) return;

  isBuying.value = true;
  buyErrorMessage.value = "";

  try {
    const action = await saveGameAction({
      gameTick: currentTick.value.tick,
      actionType: "BUY",
      assetType: "STOCK",
      actionAmount: orderAmount,
      currentCash: cashAmount.value - orderAmount,
      currentStockPrincipal: stockAmount.value + orderAmount,
      currentDeposit: depositAmount.value,
    });

    const previousQuantity = stockQuantity.value;
    const nextQuantity = previousQuantity + quantity;
    averageStockPrice.value = nextQuantity === 0
      ? 0
      : ((averageStockPrice.value * previousQuantity) + orderAmount)
        / nextQuantity;
    stockQuantity.value = nextQuantity;
    gameStart.value = {
      ...gameStart.value,
      cashAmount: action.currentCash,
      stockAmount: action.currentStockPrincipal,
      depositAmount: action.currentDeposit,
      stockQuantity: stockQuantity.value,
      averageStockPrice: averageStockPrice.value,
    };
    saveGameStartSession(gameStart.value);
    isBuySheetOpen.value = false;
  } catch (error) {
    buyErrorMessage.value = error instanceof ApiError
      ? error.message
      : "매수 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isBuying.value = false;
  }
}

async function handleSellStock({ quantity, saleAmount }) {
  if (isSelling.value || !currentTick.value || !gameStart.value) return;

  isSelling.value = true;
  sellErrorMessage.value = "";

  try {
    const isFullSale = quantity === stockQuantity.value;
    const soldStockPrincipal = Math.round(averageStockPrice.value * quantity);
    const nextStockPrincipal = isFullSale
      ? 0
      : Math.max(stockAmount.value - soldStockPrincipal, 0);
    const action = await saveGameAction({
      gameTick: currentTick.value.tick,
      actionType: "SELL",
      assetType: "STOCK",
      actionAmount: saleAmount,
      currentCash: cashAmount.value + saleAmount,
      currentStockPrincipal: nextStockPrincipal,
      currentDeposit: depositAmount.value,
    });

    stockQuantity.value -= quantity;
    if (stockQuantity.value === 0) averageStockPrice.value = 0;
    gameStart.value = {
      ...gameStart.value,
      cashAmount: action.currentCash,
      stockAmount: action.currentStockPrincipal,
      depositAmount: action.currentDeposit,
      stockQuantity: stockQuantity.value,
      averageStockPrice: averageStockPrice.value,
    };
    saveGameStartSession(gameStart.value);
    isSellSheetOpen.value = false;
  } catch (error) {
    sellErrorMessage.value = error instanceof ApiError
      ? error.message
      : "매도 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isSelling.value = false;
  }
}

async function handleCancelDeposit() {
  if (
    isCancellingDeposit.value ||
    !currentTick.value ||
    !gameStart.value ||
    depositAmount.value <= 0
  ) return;

  isCancellingDeposit.value = true;
  depositCancelErrorMessage.value = "";

  try {
    const cancelledDepositAmount = depositAmount.value;
    const action = await saveGameAction({
      gameTick: currentTick.value.tick,
      actionType: "DEPOSIT_CANCEL",
      assetType: "DEPOSIT",
      actionAmount: cancelledDepositAmount,
      currentCash: cashAmount.value + cancelledDepositAmount,
      currentStockPrincipal: stockAmount.value,
      currentDeposit: 0,
    });

    gameStart.value = {
      ...gameStart.value,
      cashAmount: action.currentCash,
      stockAmount: action.currentStockPrincipal,
      depositAmount: action.currentDeposit,
      depositStatus: action.depositStatus,
    };
    saveGameStartSession(gameStart.value);
    isDepositCancelPopupOpen.value = false;
  } catch (error) {
    depositCancelErrorMessage.value = error instanceof ApiError
      ? error.message
      : "예금 해지 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isCancellingDeposit.value = false;
  }
}

watch(currentTick, (tick) => {
  if (!tick) return;
  if (isRestoredCompletedGame.value) return;
  const event = eventsByTick.value.get(tick.tick);
  if (event && !shownEventTicks.value.has(tick.tick)) {
    shownEventTicks.value.add(tick.tick);
    activeEvent.value = event;
    pause();
    return;
  }

  if (!isGameFinished.value) return;
  if (!openDepositMaturityPopup()) requestGameCompletion();
});

watch(
  [
    isBuySheetOpen,
    isSellSheetOpen,
    isDepositCancelPopupOpen,
    isDepositMaturityPopupOpen,
  ],
  ([isBuyOpen, isSellOpen, isDepositCancelOpen, isDepositMaturityOpen]) => {
  if (isBuyOpen || isSellOpen || isDepositCancelOpen || isDepositMaturityOpen) {
    pause();
    return;
  }

  if (!activeEvent.value) resume();
  },
);

onMounted(loadScenario);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <p v-if="isLoading" class="text-caption text-muted">불러오는 중...</p>
      <p v-else-if="errorMessage" class="text-caption text-error" role="alert">
        {{ errorMessage }}
      </p>
      <template v-else>
        <MarketIndexCard
          :current-tick="currentTick"
          :prices="prices"
          :total-ticks="totalTickCount"
          :price-min="priceMin"
          :price-max="priceMax"
          :banner-event="bannerEvent"
        />
        <BaseCard v-if="gameStart">
          <GamePortfolioPanel
            :stock-quantity="stockQuantity"
            :average-stock-price="averageStockPrice"
            :stock-principal="stockAmount"
            :current-stock-price="currentTick?.price"
            :cash-amount="cashAmount"
            :deposit-amount="depositAmount"
            :deposit-status="gameStart.depositStatus"
            :remaining-deposit-days="remainingDepositDays"
            :is-trading-disabled="isGameFinished"
            @buy="handleOpenBuySheet"
            @sell="handleOpenSellSheet"
            @cancel-deposit="handleOpenDepositCancelPopup"
          />
        </BaseCard>
        <GameEventPopup
          :event="activeEvent"
          :visible="!!activeEvent"
          @close="handleCloseEvent"
        />
        <GameBuyBottomSheet
          v-model="isBuySheetOpen"
          :current-price="currentTick?.price"
          :available-amount="cashAmount"
          :is-submitting="isBuying"
          :error-message="buyErrorMessage"
          @submit="handleBuyStock"
        />
        <GameSellBottomSheet
          v-model="isSellSheetOpen"
          :current-price="currentTick?.price"
          :average-price="averageStockPrice"
          :available-quantity="stockQuantity"
          :is-submitting="isSelling"
          :error-message="sellErrorMessage"
          @submit="handleSellStock"
        />
        <GameDepositCancelPopup
          v-model="isDepositCancelPopupOpen"
          :deposit-amount="depositAmount"
          :deposit-ratio="depositRatio"
          :is-submitting="isCancellingDeposit"
          :error-message="depositCancelErrorMessage"
          @confirm="handleCancelDeposit"
        />
        <GameDepositMaturityPopup
          v-model="isDepositMaturityPopupOpen"
          :deposit-amount="depositAmount"
          @confirm="handleConfirmDepositMaturity"
        />
        <GameCompletionPopup
          v-model="isGameCompletionPopupOpen"
          :stock-amount="(currentTick?.price ?? 0) * stockQuantity"
          :cash-amount="cashAmount"
          :deposit-amount="depositAmount"
          :is-loading="isCompletingGame"
          :error-message="gameCompletionErrorMessage"
          @retry="requestGameCompletion"
          @view-result="handleViewAssessmentResult"
        />
      </template>
    </div>
  </PageContainer>
</template>
