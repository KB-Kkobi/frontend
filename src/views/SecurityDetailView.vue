<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import PageContainer from "@/components/common/PageContainer.vue";
import BackButton from "@/components/common/BackButton.vue";
import HoldingCard from "@/components/security/HoldingCard.vue";
import SecurityInsightCard from "@/components/security/SecurityInsightCard.vue";
import SecuritySummaryCard from "@/components/security/SecuritySummaryCard.vue";
import { fetchSecurity } from "@/api/investApi";

const route = useRoute();
const security = ref(null);

// 보유 원본 (mock). 나중에 API로 교체.
const holding = ref({ quantity: 10, avgPrice: 70000 });

async function loadSecurity(pk) {
  security.value = await fetchSecurity(pk);
}

watch(
  () => route.params.pk,
  (newPk) => {
    if (newPk) loadSecurity(newPk);
  },
  { immediate: true },
);

// 현재가: 지금은 security.price. 이 자리에 나중에 usePriceFeed 값이 들어온다.
const currentPrice = computed(() => security.value?.price ?? null);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <BackButton />
      <SecuritySummaryCard
        v-if="security"
        :code="security.code"
        :name="security.name"
        :market="security.market"
        :price="security.price"
        :change="security.change"
        :change-rate="security.changeRate"
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
