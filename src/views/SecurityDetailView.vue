<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import HoldingCard from "@/components/security/HoldingCard.vue";
import SecurityInsightCard from "@/components/security/SecurityInsightCard.vue";
import SecuritySummaryCard from "@/components/security/SecuritySummaryCard.vue";
import { fetchSecurityDetail, fetchSecurityQuotes } from "@/api/securityApi";
import { ApiError } from "@/api/http";
import { SECURITY_QUOTE_POLL_INTERVAL_MS } from "@/constants/security";
import { subscribeTick } from "@/api/stockSocket";

const route = useRoute();
const router = useRouter();
const isVirtualInvestment = computed(() => route.query.tradable === "true");
const security = ref(null);
const quote = ref(null);
const holding = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");

let pollingTimer = null;
let activeTicker = null;
let unsubscribeTick = null;

// 보유 종목 mock. 나중에 API(fetchHolding(code))로 교체.
const MOCK_HOLDINGS = {
  "005930": { quantity: 10, avgPrice: 70000 },
};

function loadHolding(ticker) {
  const found = MOCK_HOLDINGS[ticker];
  holding.value = found && found.quantity > 0 ? found : null;
}

function getDetailErrorMessage(error) {
  if (error instanceof ApiError && error.status === 404) {
    return "해당 증권을 찾을 수 없어요.";
  }
  if (error instanceof ApiError && error.status === 401) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
  }
  if (error instanceof ApiError) return error.message;
  return "증권 정보를 불러오지 못했습니다.";
}

async function loadQuote(ticker) {
  try {
    const { quotes } = await fetchSecurityQuotes([ticker]);
    if (activeTicker !== ticker) return;
    quote.value = quotes[0] ?? null;
  } catch (error) {
    console.error("[SecurityDetailView] 시세 조회 실패", error);
  }
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

function startPolling(ticker) {
  stopPolling();
  pollingTimer = setInterval(() => loadQuote(ticker), SECURITY_QUOTE_POLL_INTERVAL_MS);
}

async function loadSecurity(ticker) {
  security.value = null;
  quote.value = null;
  errorMessage.value = "";
  isLoading.value = true;
  activeTicker = ticker;
  stopPolling();
  loadHolding(ticker);

  try {
    const detail = await fetchSecurityDetail(ticker);
    if (activeTicker !== ticker) return;

    security.value = {
      id: detail.securityId ?? null,
      code: detail.ticker || ticker,
      name: detail.name || ticker,
      market: detail.market ?? "",
      type: detail.type,
      kisSupported: detail.kisSupported,
      sector: detail.sector,
      marketCap: detail.marketCap,
      volatility: detail.volatility,
      averageDailyMove: detail.averageDailyMove,
      maxDrawdown: detail.maxDrawdown,
      averageVolume: detail.averageVolume,
    };

    if (detail.kisSupported) {
      await loadQuote(ticker);
      if (activeTicker === ticker) {
        startPolling(ticker);
        unsubscribeTick?.();
        unsubscribeTick = subscribeTick(ticker, (tick) => {
          const price = tick.price ?? tick.currentPrice;
          if (price == null || activeTicker !== ticker) return;
          quote.value = {
            ...quote.value,
            price,
            change: tick.change ?? quote.value?.change,
            changeRate: tick.changeRate ?? quote.value?.changeRate,
          };
        });
      }
    }
  } catch (error) {
    errorMessage.value = getDetailErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => route.params.pk,
  (newPk) => {
    if (newPk) loadSecurity(newPk);
  },
  { immediate: true },
);

onUnmounted(() => {
  activeTicker = null;
  stopPolling();
  unsubscribeTick?.();
  unsubscribeTick = null;
});

const currentPrice = computed(() => quote.value?.price ?? null);
const currentChange = computed(() => quote.value?.change ?? null);
const currentChangeRate = computed(() => quote.value?.changeRate ?? null);

function handleTrade(side) {
  if (!security.value?.id) return
  router.push({
    name: 'virtual-trade',
    params: { securityId: security.value.id },
    query: { ticker: security.value.code, side },
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <BackButton />
    </div>

    <BaseCard v-if="isLoading && !security" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">증권 정보를 불러오는 중이에요</h2>
        <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="pink">
      <div class="flex flex-col gap-2" role="alert">
        <h2 class="text-h2 text-ink">증권 정보를 불러오지 못했어요</h2>
        <p class="text-caption text-muted">{{ errorMessage }}</p>
      </div>
    </BaseCard>

    <template v-else-if="security">
      <SecuritySummaryCard
        :code="security.code"
        :name="security.name"
        :market="security.market"
        :type="security.type"
        :kis-supported="security.kisSupported"
        :price="currentPrice"
        :change="currentChange"
        :change-rate="currentChangeRate"
      />

      <HoldingCard
        v-if="holding"
        :quantity="holding.quantity"
        :avg-price="holding.avgPrice"
        :current-price="currentPrice"
      />

      <SecurityInsightCard
        :product-name="security.name"
        :average-daily-move="security.averageDailyMove"
        :max-drawdown="security.maxDrawdown"
        :description="security.description ?? null"
      />

      <div v-if="isVirtualInvestment && security.kisSupported && security.id" class="flex gap-4">
        <BottomButton color="pink" @click="handleTrade('buy')">매수</BottomButton>
        <BottomButton color="blue" @click="handleTrade('sell')">매도</BottomButton>
      </div>
    </template>
  </div>
</template>
