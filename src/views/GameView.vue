<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { fetchScenario, saveGameAction } from "@/api/gameApi";
import { ApiError } from "@/api/http";
import BaseCard from "@/components/common/BaseCard.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import GameBuyBottomSheet from "@/components/game/GameBuyBottomSheet.vue";
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
  readGameStartSession,
  saveGameStartSession,
} from "@/utils/gameStorage";

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

const isLoading = ref(true);
const errorMessage = ref("");
const eventsByTick = ref(new Map());
const shownEventTicks = ref(new Set());
const activeEvent = ref(null);
const bannerEvent = ref(null);
const isBuySheetOpen = ref(false);
const isSellSheetOpen = ref(false);
const isBuying = ref(false);
const isSelling = ref(false);
const buyErrorMessage = ref("");
const sellErrorMessage = ref("");
const gameStart = ref(readGameStartSession());
const initialStockPrice = ref(0);
const averageStockPrice = ref(0);
const stockQuantity = ref(0);

const prices = computed(() => visibleTicks.value.map((tick) => tick.price));
const stockAmount = computed(() => gameStart.value?.stockAmount ?? 0);
const cashAmount = computed(() => gameStart.value?.cashAmount ?? 0);
const depositAmount = computed(() => gameStart.value?.depositAmount ?? 0);
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
    eventsByTick.value = buildEventsByTick(scenario.events);
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
  resume();
}

function handleOpenBuySheet() {
  buyErrorMessage.value = "";
  isBuySheetOpen.value = true;
}

function handleOpenSellSheet() {
  sellErrorMessage.value = "";
  isSellSheetOpen.value = true;
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

watch(currentTick, (tick) => {
  if (!tick) return;
  if (shownEventTicks.value.has(tick.tick)) return;

  const event = eventsByTick.value.get(tick.tick);
  if (!event) return;

  shownEventTicks.value.add(tick.tick);
  activeEvent.value = event;
  pause();
});

watch([isBuySheetOpen, isSellSheetOpen], ([isBuyOpen, isSellOpen]) => {
  if (isBuyOpen || isSellOpen) {
    pause();
    return;
  }

  if (!activeEvent.value) resume();
});

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
            :current-stock-price="currentTick?.price"
            :cash-amount="cashAmount"
            :deposit-amount="depositAmount"
            :deposit-status="gameStart.depositStatus"
            :remaining-deposit-days="remainingDepositDays"
            @buy="handleOpenBuySheet"
            @sell="handleOpenSellSheet"
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
      </template>
    </div>
  </PageContainer>
</template>
