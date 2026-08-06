<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import PageContainer from "@/components/common/PageContainer.vue";
import BackButton from "@/components/common/BackButton.vue";
import BasePill from "@/components/common/BasePill.vue";
import HoldingCard from "@/components/security/HoldingCard.vue";
import SecurityInsightCard from "@/components/security/SecurityInsightCard.vue";
import SecuritySummaryCard from "@/components/security/SecuritySummaryCard.vue";
import { fetchSecurity } from "@/api/investApi";
import { fetchPrice } from "@/api/stockApi";
import { useStockTick } from "@/composables/useStockTick";

const route = useRoute();
const security = ref(null);
const snapshot = ref(null);
const holding = ref(null);

// 보유 종목 mock. 나중에 API(fetchHolding(code))로 교체.
const MOCK_HOLDINGS = {
  "005930": { quantity: 10, avgPrice: 70000 },
};

function loadHolding(pk) {
  const found = MOCK_HOLDINGS[pk];
  holding.value = found && found.quantity > 0 ? found : null;
}

async function loadSecurity(pk) {
  security.value = null;
  snapshot.value = null;
  loadHolding(pk);

  const [domain, priceSnapshot] = await Promise.all([
    fetchSecurity(pk),
    fetchPrice(pk).catch((err) => {
      console.error("[SecurityDetailView] 시세 스냅샷 로드 실패", err);
      return null;
    }),
  ]);

  snapshot.value = priceSnapshot;

  // mock 도메인이 없어도 시세 스냅샷/코드만으로 렌더링되도록 fallback
  security.value = domain ?? {
    code: priceSnapshot?.stockCode ?? pk,
    name: priceSnapshot?.stockName?.trim() || pk,
    market: "",
  };
}

watch(
  () => route.params.pk,
  (newPk) => {
    if (newPk) loadSecurity(newPk);
  },
  { immediate: true },
);

const stockCode = computed(() => security.value?.code ?? null);
const { tick, isConnected, error: tickError } = useStockTick(stockCode);

// 실시간 tick > REST 스냅샷 > mock security 순으로 fallback
function pick(field) {
  if (tick.value?.[field] !== undefined && tick.value?.[field] !== null) {
    return tick.value[field];
  }
  if (snapshot.value?.[field] !== undefined && snapshot.value?.[field] !== null) {
    return snapshot.value[field];
  }
  return security.value?.[field] ?? null;
}

const currentPrice = computed(() => pick("price"));
const currentChange = computed(() => pick("change"));
const currentChangeRate = computed(() => pick("changeRate"));

const connectionBadge = computed(() => {
  if (tickError.value) {
    return { label: "연결 오류", color: "pink" };
  }
  return isConnected.value
    ? { label: "실시간 연결됨", color: "green" }
    : { label: "재연결 중", color: "pink" };
});
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <div class="flex items-center justify-between">
        <BackButton />
        <BasePill
          :label="connectionBadge.label"
          :color="connectionBadge.color"
          variant="filled"
        />
      </div>

      <SecuritySummaryCard
        v-if="security"
        :code="security.code"
        :name="security.name"
        :market="security.market"
        :price="currentPrice"
        :change="currentChange"
        :change-rate="currentChangeRate"
      />
      <p v-else class="text-body text-muted">불러오는 중...</p>

      <HoldingCard
        v-if="security && holding"
        :quantity="holding.quantity"
        :avg-price="holding.avgPrice"
        :current-price="currentPrice"
      />

      <SecurityInsightCard
        v-if="security"
        :volatility="security.volatility ?? null"
        :max-drawdown="security.maxDrawdown ?? null"
        :description="security.description ?? null"
      />
    </div>
  </PageContainer>
</template>
