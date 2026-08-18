<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import HomeRecommendationItemCard from "@/components/home/HomeRecommendationItemCard.vue";
import HomeRecommendationProductItemCard from "@/components/home/HomeRecommendationProductItemCard.vue";
import { fetchRecommendedSecurities, fetchSecurityQuotes } from "@/api/securityApi";
import { fetchRecommendedSavingsProduct } from "@/api/productApi";
import { ApiError } from "@/api/http";
import { normalizeProductType } from "@/constants/product";

const router = useRouter();

// 서버가 이미 주식·주식형 ETF 통합 1 + 채권형 ETF 1 순서로 내려준다.
const securityItems = ref([]);
const quotesByTicker = ref({});
const productItem = ref(null);
const sortFallback = ref(false);
const isLoading = ref(true);
const errorMessage = ref("");

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
    const [securitiesResponse, savingsProduct] = await Promise.all([
      fetchRecommendedSecurities(),
      fetchRecommendedSavingsProduct(),
    ]);

    securityItems.value = securitiesResponse.content;
    sortFallback.value = securitiesResponse.sortFallback;
    productItem.value = savingsProduct;

    await loadQuotes(securityItems.value);
  } catch (error) {
    securityItems.value = [];
    productItem.value = null;
    errorMessage.value =
      error instanceof ApiError ? error.message : "추천 상품을 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
}

const hasItems = computed(() => securityItems.value.length > 0 || Boolean(productItem.value));

function handleSelectSecurity(security) {
  router.push({ name: "security-detail", params: { pk: security.ticker } });
}

function handleSelectProduct(product) {
  router.push({
    name: "product-detail",
    params: {
      productType: normalizeProductType(product.productType),
      productId: product.productId,
    },
  });
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

      <div v-else-if="hasItems" class="flex gap-4 overflow-x-auto">
        <HomeRecommendationItemCard
          v-for="item in securityItems"
          :key="item.securityId ?? item.ticker"
          :security="item"
          :quote="quotesByTicker[item.ticker] ?? null"
          :match-score="item.matchScore"
          @select="handleSelectSecurity"
        />
        <HomeRecommendationProductItemCard
          v-if="productItem"
          :product="productItem"
          @select="handleSelectProduct"
        />
      </div>

      <p v-else class="text-caption text-muted">지금은 추천할 상품이 없어요.</p>
    </div>
  </BaseCard>
</template>
