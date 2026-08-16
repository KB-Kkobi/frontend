<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BackButton from '@/components/common/BackButton.vue';
import BaseCard from '@/components/common/BaseCard.vue';
import PageContainer from '@/components/common/PageContainer.vue';
import GameBuyBottomSheet from '@/components/game/GameBuyBottomSheet.vue';
import GameDepositCancelPopup from '@/components/game/GameDepositCancelPopup.vue';
import GamePortfolioPanel from '@/components/game/GamePortfolioPanel.vue';
import GameSellBottomSheet from '@/components/game/GameSellBottomSheet.vue';
import MarketIndexCard from '@/components/game/MarketIndexCard.vue';
import {
  GAME_DEPOSIT_MONTHS,
  GAME_TUTORIAL_CHART_PRICES,
  GAME_TUTORIAL_DEPOSIT_TICK_INDEX,
  GAME_TUTORIAL_HIGH_TICK_INDEX,
  GAME_TUTORIAL_LOW_TICK_INDEX,
  GAME_TUTORIAL_STARTING_ASSET,
  GAME_TUTORIAL_STEPS,
  GAME_TUTORIAL_TICK_INTERVAL_MS,
} from '@/constants/game';
import { useGameTick } from '@/composables/useGameTick';

const HIGHLIGHT_DELAY_MS = 700;

const router = useRouter();
const { currentTick, visibleTicks, totalTickCount, priceMin, priceMax, start, pause, resume } =
  useGameTick();

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

const currentStepIndex = ref(0);
const isReadyForAction = ref(false);
const cashAmount = ref(GAME_TUTORIAL_STARTING_ASSET.cashAmount);
const depositAmount = ref(GAME_TUTORIAL_STARTING_ASSET.depositAmount);
const depositStatus = ref('ACTIVE');
const stockQuantity = ref(GAME_TUTORIAL_STARTING_ASSET.stockQuantity);
const averageStockPrice = ref(GAME_TUTORIAL_STARTING_ASSET.averageStockPrice);
const stockPrincipal = ref(GAME_TUTORIAL_STARTING_ASSET.stockPrincipal);
const highlightedAsset = ref(null);
const isBuySheetOpen = ref(false);
const isSellSheetOpen = ref(false);
const isDepositCancelPopupOpen = ref(false);

const prices = computed(() => visibleTicks.value.map((tick) => tick.price));
const currentStep = computed(() => GAME_TUTORIAL_STEPS[currentStepIndex.value]);
const buyDisabled = computed(
  () => currentStepIndex.value !== 0 || !isReadyForAction.value,
);
const sellDisabled = computed(
  () => currentStepIndex.value !== 1 || !isReadyForAction.value,
);
const cancelDepositDisabled = computed(
  () => currentStepIndex.value !== 2 || !isReadyForAction.value,
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

function completeTutorial() {
  router.push({ name: 'game-start' });
}

function applyHighlight(assetType, onSettled) {
  highlightedAsset.value = assetType;
  setTimeout(() => {
    highlightedAsset.value = null;
    onSettled();
  }, HIGHLIGHT_DELAY_MS);
}

function handleOpenBuySheet() {
  isBuySheetOpen.value = true;
}

function handleOpenSellSheet() {
  isSellSheetOpen.value = true;
}

function handleOpenDepositCancelPopup() {
  isDepositCancelPopupOpen.value = true;
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
  isBuySheetOpen.value = false;

  applyHighlight('stock', () => {
    currentStepIndex.value = 1;
    isReadyForAction.value = false;
    resume();
  });
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
  isSellSheetOpen.value = false;

  applyHighlight('stock', () => {
    currentStepIndex.value = 2;
    isReadyForAction.value = false;
    resume();
  });
}

function handleCancelDeposit() {
  cashAmount.value += depositAmount.value;
  depositAmount.value = 0;
  depositStatus.value = 'CANCELLED';
  isDepositCancelPopupOpen.value = false;

  applyHighlight('deposit', completeTutorial);
}

watch(currentTick, (tick) => {
  if (!tick) return;
  if (currentStepIndex.value === 0 && tick.tick === GAME_TUTORIAL_LOW_TICK_INDEX) {
    pause();
    isReadyForAction.value = true;
    return;
  }
  if (currentStepIndex.value === 1 && tick.tick === GAME_TUTORIAL_HIGH_TICK_INDEX) {
    pause();
    isReadyForAction.value = true;
    return;
  }
  if (
    currentStepIndex.value === 2 &&
    tick.tick === GAME_TUTORIAL_DEPOSIT_TICK_INDEX
  ) {
    pause();
    isReadyForAction.value = true;
  }
});

onMounted(() => start(tutorialScenario));
</script>

<template>
  <PageContainer compact>
    <div class="flex flex-col gap-4 py-6">
      <div class="flex items-center justify-between">
        <BackButton />
        <button
          type="button"
          class="text-caption text-muted underline"
          @click="completeTutorial"
        >
          건너뛰기
        </button>
      </div>

      <MarketIndexCard
        :current-tick="currentTick"
        :prices="prices"
        :total-ticks="totalTickCount"
        :price-min="priceMin"
        :price-max="priceMax"
        compact
      />

      <BaseCard color="white">
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
          :highlighted-asset="highlightedAsset"
          @buy="handleOpenBuySheet"
          @sell="handleOpenSellSheet"
          @cancel-deposit="handleOpenDepositCancelPopup"
        >
          <template v-if="isReadyForAction" #message>
            <p class="rounded-2xl bg-pink-soft px-4 py-3 text-body text-ink">
              {{ currentStep.message }}
            </p>
          </template>
        </GamePortfolioPanel>
      </BaseCard>

      <GameBuyBottomSheet
        v-model="isBuySheetOpen"
        :current-price="currentTick?.price"
        :available-amount="cashAmount"
        @submit="handleBuyStock"
      />
      <GameSellBottomSheet
        v-model="isSellSheetOpen"
        :current-price="currentTick?.price"
        :average-price="averageStockPrice"
        :available-quantity="stockQuantity"
        @submit="handleSellStock"
      />
      <GameDepositCancelPopup
        v-model="isDepositCancelPopupOpen"
        variant="tutorial"
        :deposit-amount="depositAmount"
        :deposit-ratio="depositRatio"
        @confirm="handleCancelDeposit"
      />
    </div>
  </PageContainer>
</template>