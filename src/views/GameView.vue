<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { fetchScenario } from "@/api/gameApi";
import { ApiError } from "@/api/http";
import BaseCard from "@/components/common/BaseCard.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import GameBuyBottomSheet from "@/components/game/GameBuyBottomSheet.vue";
import GameEventPopup from "@/components/game/GameEventPopup.vue";
import GamePortfolioPanel from "@/components/game/GamePortfolioPanel.vue";
import MarketIndexCard from "@/components/game/MarketIndexCard.vue";
import {
  DEFAULT_SCENARIO_ID,
  GAME_DEPOSIT_MONTHS,
} from "@/constants/game";
import { useGameTick } from "@/composables/useGameTick";
import { readGameStartSession } from "@/utils/gameStorage";

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
const gameStart = ref(readGameStartSession());
const initialStockPrice = ref(0);

const prices = computed(() => visibleTicks.value.map((tick) => tick.price));
const stockAmount = computed(() => gameStart.value?.stockAmount ?? 0);
const cashAmount = computed(() => gameStart.value?.cashAmount ?? 0);
const depositAmount = computed(() => gameStart.value?.depositAmount ?? 0);
const stockQuantity = computed(() => {
  if (!initialStockPrice.value) return 0;
  return Math.floor(stockAmount.value / initialStockPrice.value);
});
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

watch(currentTick, (tick) => {
  if (!tick) return;
  if (shownEventTicks.value.has(tick.tick)) return;

  const event = eventsByTick.value.get(tick.tick);
  if (!event) return;

  shownEventTicks.value.add(tick.tick);
  activeEvent.value = event;
  pause();
});

watch(isBuySheetOpen, (isOpen) => {
  if (isOpen) {
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
            :average-stock-price="initialStockPrice"
            :current-stock-price="currentTick?.price"
            :cash-amount="cashAmount"
            :deposit-amount="depositAmount"
            :deposit-status="gameStart.depositStatus"
            :remaining-deposit-days="remainingDepositDays"
            @buy="isBuySheetOpen = true"
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
        />
      </template>
    </div>
  </PageContainer>
</template>
