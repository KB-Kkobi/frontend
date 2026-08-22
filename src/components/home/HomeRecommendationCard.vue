<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import HomeRecommendationItemCard from "@/components/home/HomeRecommendationItemCard.vue";
import HomeRecommendationProductItemCard from "@/components/home/HomeRecommendationProductItemCard.vue";
import { fetchRecommendedSecurities, fetchSecurityQuotes } from "@/api/securityApi";
import {
  fetchDepositProductList,
  fetchSavingProductList,
} from "@/api/productApi";
import { ApiError } from "@/api/http";
import { normalizeProductType } from "@/constants/product";

const router = useRouter();

// 서버가 이미 주식·주식형 ETF 통합 1 + 채권형 ETF 1 순서로 내려준다.
const securityItems = ref([]);
const quotesByTicker = ref({});
const depositItem = ref(null);
const savingItem = ref(null);
const sortFallback = ref(false);
const isLoading = ref(true);
const errorMessage = ref("");
const recommendationTrack = ref(null);
const currentRecommendationIndex = ref(0);
const isRecommendationAtStart = ref(true);
const isRecommendationAtEnd = ref(false);
const hasRecommendationOverflow = ref(false);

const RECOMMENDATION_CARD_GAP = 16;
let recommendationResizeObserver = null;

const PREVIEW_ENV_KEYS = Object.freeze({
  securities: "VITE_HOME_RECOMMENDATION_PREVIEW_SECURITIES",
  quotes: "VITE_HOME_RECOMMENDATION_PREVIEW_QUOTES",
  deposit: "VITE_HOME_RECOMMENDATION_PREVIEW_DEPOSIT_PRODUCT",
  saving: "VITE_HOME_RECOMMENDATION_PREVIEW_SAVING_PRODUCT",
});

const isPreviewMode =
  import.meta.env.DEV && import.meta.env.VITE_HOME_RECOMMENDATION_PREVIEW === "true";

function parsePreviewJson(key, fallback) {
  const rawValue = import.meta.env[key];
  if (!rawValue) return fallback;

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn("[HomeRecommendationCard] 미리보기 데이터 형식이 올바르지 않습니다.", error);
    return fallback;
  }
}

function loadPreviewRecommendations() {
  const previewSecurities = parsePreviewJson(PREVIEW_ENV_KEYS.securities, []);
  const previewQuotes = parsePreviewJson(PREVIEW_ENV_KEYS.quotes, {});
  const previewDeposit = parsePreviewJson(PREVIEW_ENV_KEYS.deposit, null);
  const previewSaving = parsePreviewJson(PREVIEW_ENV_KEYS.saving, null);

  securityItems.value = Array.isArray(previewSecurities) ? previewSecurities : [];
  quotesByTicker.value = previewQuotes && typeof previewQuotes === "object" ? previewQuotes : {};
  depositItem.value = previewDeposit && typeof previewDeposit === "object" ? previewDeposit : null;
  savingItem.value = previewSaving && typeof previewSaving === "object" ? previewSaving : null;
  sortFallback.value = false;
}

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

  if (isPreviewMode) {
    loadPreviewRecommendations();
    isLoading.value = false;
    return;
  }

  try {
    const [securitiesResponse, depositProducts, savingProducts] = await Promise.all([
      fetchRecommendedSecurities(),
      fetchDepositProductList({ page: 1, size: 1 }),
      fetchSavingProductList({ page: 1, size: 1 }),
    ]);

    securityItems.value = securitiesResponse.content;
    sortFallback.value = securitiesResponse.sortFallback;
    depositItem.value = depositProducts.content[0] ?? null;
    savingItem.value = savingProducts.content[0] ?? null;

    await loadQuotes(securityItems.value);
  } catch (error) {
    securityItems.value = [];
    depositItem.value = null;
    savingItem.value = null;
    errorMessage.value =
      error instanceof ApiError ? error.message : "추천 상품을 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
}

const hasItems = computed(
  () => securityItems.value.length > 0 || Boolean(depositItem.value) || Boolean(savingItem.value),
);
const recommendationItemCount = computed(
  () => securityItems.value.length + (depositItem.value ? 1 : 0) + (savingItem.value ? 1 : 0),
);
const hasMultipleRecommendations = computed(() => recommendationItemCount.value > 1);

function updateRecommendationNavigation(track = recommendationTrack.value) {
  if (!track) {
    hasRecommendationOverflow.value = false;
    currentRecommendationIndex.value = 0;
    isRecommendationAtStart.value = true;
    isRecommendationAtEnd.value = true;
    return;
  }

  const maxScrollLeft = track.scrollWidth - track.clientWidth;

  if (maxScrollLeft <= 0 || recommendationItemCount.value <= 1) {
    hasRecommendationOverflow.value = false;
    currentRecommendationIndex.value = 0;
    isRecommendationAtStart.value = true;
    isRecommendationAtEnd.value = true;
    return;
  }

  hasRecommendationOverflow.value = true;
  isRecommendationAtStart.value = track.scrollLeft <= 1;
  isRecommendationAtEnd.value = track.scrollLeft >= maxScrollLeft - 1;
  const cardWidth = track.firstElementChild?.clientWidth ?? track.clientWidth;
  const cardStep = cardWidth + RECOMMENDATION_CARD_GAP;
  currentRecommendationIndex.value = isRecommendationAtEnd.value
    ? recommendationItemCount.value - 1
    : Math.min(
        Math.round(track.scrollLeft / cardStep),
        recommendationItemCount.value - 1,
      );
}

function handleRecommendationScroll(event) {
  updateRecommendationNavigation(event.currentTarget);
}

function moveRecommendationTo(edge) {
  const track = recommendationTrack.value;
  if (!track) return;

  track.scrollTo({
    left: edge === "start" ? 0 : track.scrollWidth,
    behavior: "smooth",
  });
}

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

watch(recommendationTrack, (track) => {
  recommendationResizeObserver?.disconnect();

  if (!track) {
    updateRecommendationNavigation();
    return;
  }

  recommendationResizeObserver = new ResizeObserver(() => {
    updateRecommendationNavigation(track);
  });
  recommendationResizeObserver.observe(track);
  updateRecommendationNavigation(track);
});

onMounted(loadRecommendations);

onBeforeUnmount(() => {
  recommendationResizeObserver?.disconnect();
});
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-h2 text-ink">추천 금융상품</h2>
        <button
          type="button"
          class="shrink-0 text-caption text-navy"
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

      <div v-else-if="hasItems" class="flex flex-col gap-4">
        <div
          ref="recommendationTrack"
          class="recommendation-track flex snap-x snap-mandatory gap-4 overflow-x-auto"
          @scroll.passive="handleRecommendationScroll"
        >
          <HomeRecommendationItemCard
            v-for="item in securityItems"
            :key="item.securityId ?? item.ticker"
            :security="item"
            :quote="quotesByTicker[item.ticker] ?? null"
            :match-score="item.matchScore"
            @select="handleSelectSecurity"
          />
          <HomeRecommendationProductItemCard
            v-if="depositItem"
            :product="depositItem"
            @select="handleSelectProduct"
          />
          <HomeRecommendationProductItemCard
            v-if="savingItem"
            :product="savingItem"
            @select="handleSelectProduct"
          />
        </div>

        <nav
          v-if="hasMultipleRecommendations && hasRecommendationOverflow"
          class="flex items-center justify-between gap-4"
          aria-label="추천 금융상품 넘기기"
        >
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink disabled:text-muted disabled:opacity-50"
            aria-label="이전 추천 상품 보기"
            :disabled="isRecommendationAtStart"
            @click="moveRecommendationTo('start')"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                d="m14 6-6 6 6 6"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <div class="flex flex-1 items-center gap-2" aria-hidden="true">
            <span
              v-for="index in recommendationItemCount"
              :key="index"
              :class="[
                index - 1 === currentRecommendationIndex ? 'bg-pink' : 'bg-line',
                'h-1 flex-1 rounded-full',
              ]"
            />
          </div>

          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink disabled:text-muted disabled:opacity-50"
            aria-label="다음 추천 상품 보기"
            :disabled="isRecommendationAtEnd"
            @click="moveRecommendationTo('end')"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                d="m10 6 6 6-6 6"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </nav>
      </div>

      <p v-else class="text-caption text-muted">지금은 추천할 상품이 없어요.</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.recommendation-track {
  scrollbar-width: none;
}

.recommendation-track::-webkit-scrollbar {
  display: none;
}
</style>
