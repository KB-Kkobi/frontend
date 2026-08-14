<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import HomeRecommendationItemCard from "@/components/home/HomeRecommendationItemCard.vue";
import { fetchRecommendedSecurities, fetchSecurityQuotes } from "@/api/securityApi";
import { ApiError } from "@/api/http";
import { SECURITY_TYPES, normalizeSecurityType } from "@/constants/security";

const router = useRouter();

// 카드 노출 순서: 주식 → 채권형 ETF → 주식형 ETF
const SECURITY_TYPE_ORDER = [
  SECURITY_TYPES.STOCK,
  SECURITY_TYPES.BOND_ETF,
  SECURITY_TYPES.EQUITY_ETF,
];

const items = ref([]);
const quotesByTicker = ref({});
const sortFallback = ref(false);
const isLoading = ref(true);
const errorMessage = ref("");

const sortedItems = computed(() =>
  [...items.value].sort(
    (a, b) =>
      SECURITY_TYPE_ORDER.indexOf(normalizeSecurityType(a.type)) -
      SECURITY_TYPE_ORDER.indexOf(normalizeSecurityType(b.type)),
  ),
);

async function loadQuotes(recommendedItems) {
  const tickers = recommendedItems
    .filter((item) => item.kisSupported)
    .map((item) => item.ticker);
  if (tickers.length === 0) {
    quotesByTicker.value = {};
    return;
  }

  try {
    const { quotes } = await fetchSecurityQuotes(tickers);
    const nextMap = {};
    quotes.forEach((quote) => {
      nextMap[quote.ticker] = quote;
    });
    quotesByTicker.value = nextMap;
  } catch (error) {
    console.error("[HomeRecommendationCard] 시세 조회 실패", error);
    quotesByTicker.value = {};
  }
}

async function loadRecommendations() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchRecommendedSecurities();
    items.value = response.content;
    sortFallback.value = response.sortFallback;
    await loadQuotes(response.content);
  } catch (error) {
    items.value = [];
    errorMessage.value =
      error instanceof ApiError ? error.message : "추천 상품을 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
}

function handleSelectSecurity(security) {
  router.push({ name: "security-detail", params: { pk: security.ticker } });
}

function goToProducts() {
  router.push({ name: "products" });
}

onMounted(loadRecommendations);
</script>

<template>
  <BaseCard color="pink">
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-h2 text-ink">추천 금융상품</h2>
        <button
          type="button"
          class="shrink-0 text-caption text-muted"
          @click="goToProducts"
        >
          더보기 &gt;
        </button>
      </div>

      <p v-if="sortFallback && !isLoading && !errorMessage" class="text-caption text-muted">
        성향 진단을 완료하면 나에게 맞는 상품을 추천해드려요. 지금은 인기 상품이에요.
      </p>

      <p v-if="isLoading" class="text-caption text-muted" role="status">
        추천 상품을 불러오는 중이에요.
      </p>

      <div v-else-if="errorMessage" class="flex flex-col gap-4" role="alert">
        <p class="text-caption text-muted">{{ errorMessage }}</p>
        <BottomButton color="white" @click="loadRecommendations">
          다시 시도하기
        </BottomButton>
      </div>

      <div v-else-if="items.length" class="flex gap-4 overflow-x-auto">
        <HomeRecommendationItemCard
          v-for="item in sortedItems"
          :key="item.securityId ?? item.ticker"
          :security="item"
          :quote="quotesByTicker[item.ticker] ?? null"
          :match-score="item.matchScore"
          @select="handleSelectSecurity"
        />
      </div>

      <p v-else class="text-caption text-muted">지금은 추천할 상품이 없어요.</p>
    </div>
  </BaseCard>
</template>
