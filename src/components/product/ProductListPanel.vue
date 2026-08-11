<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchLatestAssessment } from "@/api/assessmentApi";
import { fetchPersonas } from "@/api/personaApi";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
  fetchProductList,
} from "@/api/productApi";
import { fetchSecurityList, fetchSecurityQuotes } from "@/api/securityApi";
import ProductListCard from "@/components/product/ProductListCard.vue";
import SecurityListCard from "@/components/security/SecurityListCard.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import { ApiError, resolveApiUrl } from "@/api/http";
import {
  PRODUCT_LIST_DEFAULTS,
  PRODUCT_SORT_OPTIONS,
  PRODUCT_TYPES,
  RESERVE_TYPE_OPTIONS,
  SAVING_TERM_OPTIONS,
  getProductTypeLabel,
  normalizeProductType,
} from "@/constants/product";
import {
  SECURITY_LIST_DEFAULTS,
  SECURITY_TYPE_FILTER_OPTIONS,
} from "@/constants/security";

const props = defineProps({
  /**
   * true: 독립 페이지 모드 — 헤더·URL 쿼리 동기화 포함
   * false: 임베드 모드 — 헤더 없음, URL 쿼리 동기화 없음
   */
  standalone: { type: Boolean, default: true },
  /**
   * 나중에 가상투자 매매 UI를 추가할 때 사용
   */
  tradable: { type: Boolean, default: false },
});

const emit = defineEmits(["select-security", "select-product"]);

const LIST_TABS = Object.freeze({
  DEPOSIT: PRODUCT_TYPES.DEPOSIT,
  SAVING: PRODUCT_TYPES.SAVING,
  SECURITY: "SECURITY",
});

const LIST_TAB_OPTIONS = Object.freeze([
  { key: LIST_TABS.DEPOSIT, label: "예금" },
  { key: LIST_TABS.SAVING, label: "적금" },
  { key: LIST_TABS.SECURITY, label: "증권" },
]);

const router = useRouter();
const route = useRoute();

const TAB_KEYS = new Set(Object.values(LIST_TABS));

function parseInitialTab(value) {
  return TAB_KEYS.has(value) ? value : LIST_TABS.DEPOSIT;
}

function parseInitialInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const initialQuery = route.query;

const activeTab = ref(parseInitialTab(initialQuery.tab));
const searchInput = ref(String(initialQuery.keyword ?? ""));
const appliedKeyword = ref(String(initialQuery.keyword ?? ""));
const securitySearchInput = ref(String(initialQuery.securityKeyword ?? ""));
const appliedSecurityKeyword = ref(String(initialQuery.securityKeyword ?? ""));
const selectedSavingTerm = ref(
  parseInitialInt(initialQuery.savingTerm, PRODUCT_LIST_DEFAULTS.savingTerm),
);
const selectedReserveType = ref(String(initialQuery.reserveType ?? ""));
const selectedSort = ref(String(initialQuery.sort ?? PRODUCT_LIST_DEFAULTS.sort));
const selectedSecurityType = ref(String(initialQuery.securityType ?? ""));
const currentPage = ref(
  parseInitialInt(initialQuery.page, PRODUCT_LIST_DEFAULTS.page),
);
const products = ref([]);
const securities = ref([]);
const quotesByTicker = ref({});
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const latestAssessment = ref(null);
const isAssessmentLoading = ref(props.standalone);
const assessmentMessage = ref("");
const isPersonaImageAvailable = ref(true);

const isSecurityTab = computed(() => activeTab.value === LIST_TABS.SECURITY);
const isSaving = computed(() => activeTab.value === LIST_TABS.SAVING);

const activeTabLabel = computed(() =>
  isSecurityTab.value ? "증권" : getProductTypeLabel(activeTab.value),
);

const hasPreviousPage = computed(() => currentPage.value > 1);
const hasNextPage = computed(() => currentPage.value < totalPages.value);

function getProductErrorMessage(error) {
  if (
    error instanceof ProductApiError &&
    error.code === PRODUCT_API_ERROR_CODES.UNAUTHORIZED
  ) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
  }
  if (error instanceof ProductApiError) return error.message;
  return "상품 목록을 불러오지 못했습니다.";
}

function getSecurityErrorMessage(error) {
  if (error instanceof ApiError && error.status === 401) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
  }
  if (error instanceof ApiError) return error.message;
  return "증권 목록을 불러오지 못했습니다.";
}

async function loadProducts() {
  const response = await fetchProductList(activeTab.value, {
    keyword: appliedKeyword.value,
    savingTerm: selectedSavingTerm.value,
    reserveType: isSaving.value ? selectedReserveType.value : "",
    page: currentPage.value,
    size: PRODUCT_LIST_DEFAULTS.size,
    sort: selectedSort.value,
  });

  products.value = response.content;
  securities.value = [];
  currentPage.value = response.page;
  totalElements.value = response.totalElements;
  totalPages.value = response.totalPages;
}

async function loadLatestAssessment() {
  isAssessmentLoading.value = true;
  assessmentMessage.value = "";
  isPersonaImageAvailable.value = true;

  try {
    const assessment = await fetchLatestAssessment();
    latestAssessment.value = assessment;

    try {
      const personas = await fetchPersonas();
      const persona = personas.find(
        (item) => item.axisCode === assessment.personaCode,
      );
      if (persona?.imagePath) {
        latestAssessment.value = {
          ...assessment,
          imagePath: resolveApiUrl(persona.imagePath),
        };
      }
    } catch {
      // 성향 본문은 유지하고 이미지가 없을 때만 텍스트 카드로 표시한다.
    }
  } catch (error) {
    latestAssessment.value = null;
    assessmentMessage.value =
      error instanceof ApiError && (error.status === 401 || error.status === 403)
        ? "로그인 후 나의 투자 성향을 확인할 수 있어요."
        : "성향 진단을 완료하면 나에게 맞는 투자 성향이 표시돼요.";
  } finally {
    isAssessmentLoading.value = false;
  }
}

function handlePersonaImageError() {
  isPersonaImageAvailable.value = false;
}

async function loadSecurityQuotes(items) {
  const tickers = items
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
    console.error("[ProductListPanel] 시세 조회 실패", error);
    quotesByTicker.value = {};
  }
}

async function loadSecurities() {
  const response = await fetchSecurityList({
    type: selectedSecurityType.value,
    keyword: appliedSecurityKeyword.value,
    page: currentPage.value,
    size: SECURITY_LIST_DEFAULTS.size,
  });

  securities.value = response.content;
  products.value = [];
  quotesByTicker.value = {};
  currentPage.value = response.page;
  totalElements.value = response.totalElements;
  totalPages.value = response.totalPages;

  await loadSecurityQuotes(response.content);
}

async function loadList() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    if (isSecurityTab.value) {
      await loadSecurities();
    } else {
      await loadProducts();
    }
  } catch (error) {
    products.value = [];
    securities.value = [];
    quotesByTicker.value = {};
    totalElements.value = 0;
    totalPages.value = 0;
    errorMessage.value = isSecurityTab.value
      ? getSecurityErrorMessage(error)
      : getProductErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

function resetPage() {
  currentPage.value = PRODUCT_LIST_DEFAULTS.page;
}

function handleSelectTab(tabKey) {
  activeTab.value = tabKey;
  selectedReserveType.value = "";
  selectedSecurityType.value = "";
  securitySearchInput.value = "";
  appliedSecurityKeyword.value = "";
  resetPage();
}

function handleSearch() {
  appliedKeyword.value = searchInput.value.trim();
  resetPage();
}

function handleSecuritySearch() {
  appliedSecurityKeyword.value = securitySearchInput.value.trim();
  resetPage();
}

function handleSelectSavingTerm(savingTerm) {
  selectedSavingTerm.value = savingTerm;
  resetPage();
}

function handleSelectReserveType(reserveType) {
  selectedReserveType.value = reserveType;
  resetPage();
}

function handleSelectSecurityType(securityType) {
  selectedSecurityType.value = securityType;
  resetPage();
}

function handleSelectProduct(product) {
  if (emit("select-product", product) === false) return;
  router.push({
    name: "product-detail",
    params: {
      productType: normalizeProductType(product.productType),
      productId: product.productId,
    },
  });
}

function handleSelectSecurity(security) {
  if (emit("select-security", security) === false) return;
  router.push({
    name: "security-detail",
    params: { pk: security.ticker },
  });
}

function handlePreviousPage() {
  if (hasPreviousPage.value) currentPage.value -= 1;
}

function handleNextPage() {
  if (hasNextPage.value) currentPage.value += 1;
}

// URL 쿼리 동기화 — standalone 모드에서만
function buildQueryFromState() {
  const query = {};
  if (activeTab.value !== LIST_TABS.DEPOSIT) query.tab = activeTab.value;
  if (appliedKeyword.value) query.keyword = appliedKeyword.value;
  if (appliedSecurityKeyword.value) query.securityKeyword = appliedSecurityKeyword.value;
  if (selectedSavingTerm.value !== PRODUCT_LIST_DEFAULTS.savingTerm) {
    query.savingTerm = String(selectedSavingTerm.value);
  }
  if (selectedReserveType.value) query.reserveType = selectedReserveType.value;
  if (selectedSort.value !== PRODUCT_LIST_DEFAULTS.sort) {
    query.sort = selectedSort.value;
  }
  if (selectedSecurityType.value) query.securityType = selectedSecurityType.value;
  if (currentPage.value !== PRODUCT_LIST_DEFAULTS.page) {
    query.page = String(currentPage.value);
  }
  return query;
}

function isQueryEqual(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => String(a[key]) === String(b[key]));
}

function syncQueryFromState() {
  const nextQuery = buildQueryFromState();
  if (isQueryEqual(route.query, nextQuery)) return;
  router.replace({ query: nextQuery });
}

watch(
  () => [
    activeTab.value,
    appliedKeyword.value,
    appliedSecurityKeyword.value,
    selectedSavingTerm.value,
    selectedReserveType.value,
    selectedSort.value,
    selectedSecurityType.value,
    currentPage.value,
  ],
  () => {
    syncQueryFromState();
    loadList();
  },
  { immediate: true },
);

onMounted(() => {
  if (props.standalone) loadLatestAssessment();
});
</script>

<template>
  <div class="flex flex-col gap-6" :class="standalone ? 'py-6' : ''">
    <header v-if="standalone" class="flex flex-col gap-2 text-center">
      <h1 class="text-h1 text-ink">상품</h1>
      <p class="text-caption text-muted">
        나에게 맞는 예금·적금·증권 상품을 확인해 보세요.
      </p>
    </header>

    <BaseCard v-if="standalone" color="white">
      <div v-if="isAssessmentLoading" class="flex flex-col gap-2" role="status">
        <p class="text-caption text-muted">성향</p>
        <h2 class="text-h2 text-ink">나의 투자 성향을 불러오는 중이에요</h2>
      </div>
      <div v-else-if="latestAssessment" class="flex items-center gap-4">
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <p class="text-caption text-muted">성향</p>
          <h2 class="text-h1 text-ink">{{ latestAssessment.typeName }}</h2>
          <p class="text-body text-muted tracking-tight">
            {{ latestAssessment.investmentFeature }}
          </p>
        </div>
        <img
          v-if="latestAssessment.imagePath && isPersonaImageAvailable"
          :src="latestAssessment.imagePath"
          :alt="`${latestAssessment.typeName} 성향 이미지`"
          class="h-20 w-20 shrink-0 object-contain"
          @error="handlePersonaImageError"
        />
      </div>
      <div v-else class="flex flex-col gap-2">
        <p class="text-caption text-muted">성향</p>
        <h2 class="text-h2 text-ink">아직 확인된 투자 성향이 없어요</h2>
        <p class="text-caption text-muted">{{ assessmentMessage }}</p>
      </div>
    </BaseCard>

    <div class="flex gap-2" aria-label="상품 유형">
      <button
        v-for="option in LIST_TAB_OPTIONS"
        :key="option.key"
        type="button"
        :class="[
          activeTab === option.key
            ? 'bg-pink text-white'
            : 'border border-line bg-white text-muted',
          'flex-1 rounded-2xl px-4 py-3 text-button',
        ]"
        @click="handleSelectTab(option.key)"
      >
        {{ option.label }}
      </button>
    </div>

    <template v-if="!isSecurityTab">
      <form class="flex gap-2" role="search" @submit.prevent="handleSearch">
        <input
          v-model="searchInput"
          type="search"
          class="min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-body text-ink outline-none focus:border-pink"
          placeholder="은행명 또는 상품명 검색"
          aria-label="은행명 또는 상품명 검색"
        />
        <button
          type="submit"
          class="rounded-2xl bg-pink px-4 py-3 text-button text-white"
        >
          검색
        </button>
      </form>

      <div class="flex flex-wrap gap-2" aria-label="가입 기간">
        <button
          v-for="savingTerm in SAVING_TERM_OPTIONS"
          :key="savingTerm"
          type="button"
          :class="[
            selectedSavingTerm === savingTerm
              ? 'border-pink bg-pink-soft text-pink'
              : 'border-line bg-white text-muted',
            'rounded-2xl border px-4 py-3 text-caption font-semibold',
          ]"
          @click="handleSelectSavingTerm(savingTerm)"
        >
          {{ savingTerm }}개월
        </button>
      </div>

      <div v-if="isSaving" class="flex flex-wrap gap-2" aria-label="적립 유형">
        <button
          v-for="reserveType in RESERVE_TYPE_OPTIONS"
          :key="reserveType.value"
          type="button"
          :class="[
            selectedReserveType === reserveType.value
              ? 'border-blue bg-blue-soft text-blue'
              : 'border-line bg-white text-muted',
            'rounded-2xl border px-4 py-3 text-caption font-semibold',
          ]"
          @click="handleSelectReserveType(reserveType.value)"
        >
          {{ reserveType.label }}
        </button>
      </div>
    </template>

    <template v-else>
      <form class="flex gap-2" role="search" @submit.prevent="handleSecuritySearch">
        <input
          v-model="securitySearchInput"
          type="search"
          class="min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-body text-ink outline-none focus:border-pink"
          placeholder="종목명 또는 티커 검색"
          aria-label="종목명 또는 티커 검색"
        />
        <button
          type="submit"
          class="rounded-2xl bg-pink px-4 py-3 text-button text-white"
        >
          검색
        </button>
      </form>

      <div class="flex flex-wrap gap-2" aria-label="증권 유형">
        <button
          v-for="option in SECURITY_TYPE_FILTER_OPTIONS"
          :key="option.value || 'all'"
          type="button"
          :class="[
            selectedSecurityType === option.value
              ? 'border-pink bg-pink-soft text-pink'
              : 'border-line bg-white text-muted',
            'rounded-2xl border px-4 py-3 text-caption font-semibold',
          ]"
          @click="handleSelectSecurityType(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </template>

    <div class="flex items-center justify-between gap-4">
      <p class="text-caption text-muted tabular-nums">
        {{ activeTabLabel }} {{ totalElements.toLocaleString("ko-KR") }}개
      </p>
      <select
        v-if="!isSecurityTab"
        v-model="selectedSort"
        class="rounded-2xl border border-line bg-white px-4 py-3 text-caption text-ink outline-none focus:border-pink"
        aria-label="상품 정렬"
        @change="resetPage"
      >
        <option
          v-for="sortOption in PRODUCT_SORT_OPTIONS"
          :key="sortOption.value"
          :value="sortOption.value"
        >
          {{ sortOption.label }}
        </option>
      </select>
    </div>

    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">
          {{ activeTabLabel }} 목록을 불러오는 중이에요
        </h2>
        <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="pink">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">
            {{ activeTabLabel }} 목록을 불러오지 못했어요
          </h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadList">
          다시 시도하기
        </BottomButton>
      </div>
    </BaseCard>

    <div
      v-else-if="isSecurityTab && securities.length"
      class="flex flex-col gap-4"
    >
      <SecurityListCard
        v-for="security in securities"
        :key="security.securityId ?? security.ticker"
        :security="security"
        :quote="quotesByTicker[security.ticker] ?? null"
        @select="handleSelectSecurity"
      />
    </div>

    <div
      v-else-if="!isSecurityTab && products.length"
      class="flex flex-col gap-4"
    >
      <ProductListCard
        v-for="product in products"
        :key="product.productId"
        :product="product"
        @select="handleSelectProduct"
      />
    </div>

    <BaseCard v-else color="blue">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">조건에 맞는 상품이 없어요</h2>
        <p class="text-caption text-muted">
          {{
            isSecurityTab
              ? "다른 증권 유형을 선택해 다시 확인해 주세요."
              : "검색어나 가입 기간을 바꿔 다시 확인해 주세요."
          }}
        </p>
      </div>
    </BaseCard>

    <nav
      v-if="!isLoading && !errorMessage && totalPages > 0"
      class="flex items-center justify-between gap-4"
      aria-label="상품 목록 페이지"
    >
      <button
        type="button"
        class="rounded-2xl border border-line bg-white px-4 py-3 text-button text-ink disabled:opacity-50"
        :disabled="!hasPreviousPage"
        @click="handlePreviousPage"
      >
        이전
      </button>
      <span class="text-caption text-muted tabular-nums">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        type="button"
        class="rounded-2xl border border-line bg-white px-4 py-3 text-button text-ink disabled:opacity-50"
        :disabled="!hasNextPage"
        @click="handleNextPage"
      >
        다음
      </button>
    </nav>
  </div>
</template>
