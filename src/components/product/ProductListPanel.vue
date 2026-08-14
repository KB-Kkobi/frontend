<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchLatestAssessment } from "@/api/assessmentApi";
import { ApiError, resolveApiUrl } from "@/api/http";
import { fetchPersonas } from "@/api/personaApi";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
  fetchProductList,
} from "@/api/productApi";
import { fetchSecurityList, fetchSecurityQuotes } from "@/api/securityApi";
import ProductListCard from "@/components/product/ProductListCard.vue";
import ProductFilterModal from "@/components/product/ProductFilterModal.vue";
import SecurityListCard from "@/components/security/SecurityListCard.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import {
  PREFERENTIAL_CONDITION_OPTIONS,
  PRODUCT_LIST_DEFAULTS,
  PRODUCT_SEARCH_DEBOUNCE_MS,
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
import { debounce } from "@/utils/debounce";

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
  { key: LIST_TABS.SECURITY, label: "주식" },
  { key: LIST_TABS.DEPOSIT, label: "예금" },
  { key: LIST_TABS.SAVING, label: "적금" },
]);
const VISIBLE_PAGE_COUNT = 4;

const router = useRouter();
const route = useRoute();

const TAB_KEYS = new Set(Object.values(LIST_TABS));

function parseInitialTab(value, fallbackTab) {
  return TAB_KEYS.has(value) ? value : fallbackTab;
}

function parseInitialInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseInitialList(value) {
  if (value === null || value === undefined || value === "") return [];
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values.flatMap((item) => String(item).split(",")).filter(Boolean),
    ),
  ];
}

function parseInitialSavingTerms(query) {
  return parseInitialList(query.savingTerms ?? query.savingTerm)
    .map(Number)
    .filter((savingTerm) => SAVING_TERM_OPTIONS.includes(savingTerm));
}

function parseInitialOptionValues(value, options) {
  const allowedValues = new Set(options.map((option) => option.value));
  return parseInitialList(value).filter((item) => allowedValues.has(item));
}

const initialQuery = route.query;
// 가상투자 상품 추천은 주식 탭을 먼저 보여준다.
const defaultTab = props.standalone ? LIST_TABS.SAVING : LIST_TABS.SECURITY;
const initialSavingTerms = parseInitialSavingTerms(initialQuery);
if (!props.standalone && initialSavingTerms.length === 0) {
  initialSavingTerms.push(12);
}

const activeTab = ref(parseInitialTab(initialQuery.tab, defaultTab));
const searchInput = ref(String(initialQuery.keyword ?? ""));
const appliedKeyword = ref(String(initialQuery.keyword ?? ""));
const securitySearchInput = ref(String(initialQuery.securityKeyword ?? ""));
const appliedSecurityKeyword = ref(String(initialQuery.securityKeyword ?? ""));
const selectedSavingTerms = ref(initialSavingTerms);
const selectedReserveTypes = ref(
  parseInitialOptionValues(
    initialQuery.reserveTypes ?? initialQuery.reserveType,
    RESERVE_TYPE_OPTIONS,
  ),
);
const selectedPreferentialConditions = ref(
  parseInitialOptionValues(
    initialQuery.preferentialConditions,
    PREFERENTIAL_CONDITION_OPTIONS,
  ),
);
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
const isFilterOpen = ref(false);

const isSecurityTab = computed(() => activeTab.value === LIST_TABS.SECURITY);
const isSaving = computed(() => activeTab.value === LIST_TABS.SAVING);

const activeTabLabel = computed(() =>
  isSecurityTab.value ? "주식" : getProductTypeLabel(activeTab.value),
);

const pageGroupStart = computed(
  () =>
    Math.floor((currentPage.value - 1) / VISIBLE_PAGE_COUNT) *
      VISIBLE_PAGE_COUNT +
    1,
);
const hasPreviousPageGroup = computed(() => pageGroupStart.value > 1);
const hasNextPageGroup = computed(
  () => pageGroupStart.value + VISIBLE_PAGE_COUNT <= totalPages.value,
);
const visiblePageNumbers = computed(() => {
  const pageCount = Math.min(
    totalPages.value - pageGroupStart.value + 1,
    VISIBLE_PAGE_COUNT,
  );

  return Array.from(
    { length: pageCount },
    (_, index) => pageGroupStart.value + index,
  );
});
const activeFilterCount = computed(
  () =>
    selectedSavingTerms.value.length +
    (isSaving.value ? selectedReserveTypes.value.length : 0) +
    selectedPreferentialConditions.value.length,
);
const hasAppliedFilters = computed(() => activeFilterCount.value > 0);
const activeFilterLabels = computed(() => {
  const labels = selectedSavingTerms.value.map(
    (savingTerm) => `${savingTerm}개월`,
  );
  if (isSaving.value) {
    selectedReserveTypes.value.forEach((reserveType) => {
      const option = RESERVE_TYPE_OPTIONS.find(
        (item) => item.value === reserveType,
      );
      if (option) labels.push(option.label);
    });
  }
  selectedPreferentialConditions.value.forEach((conditionType) => {
    const option = PREFERENTIAL_CONDITION_OPTIONS.find(
      (item) => item.value === conditionType,
    );
    if (option) labels.push(option.label);
  });
  return labels;
});

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
    savingTerms: selectedSavingTerms.value.length
      ? selectedSavingTerms.value
      : props.standalone
        ? SAVING_TERM_OPTIONS
        : [12],
    reserveTypes: isSaving.value ? selectedReserveTypes.value : [],
    preferentialConditions: selectedPreferentialConditions.value,
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
    if (
      !assessment ||
      typeof assessment !== "object" ||
      !String(assessment.typeName ?? "").trim()
    ) {
      latestAssessment.value = null;
      assessmentMessage.value =
        "성향 진단을 완료하면 나에게 맞는 투자 성향을 표시해요.";
      return;
    }

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
  searchInput.value = "";
  appliedKeyword.value = "";
  selectedReserveTypes.value = [];
  selectedSecurityType.value = "";
  securitySearchInput.value = "";
  appliedSecurityKeyword.value = "";
  resetPage();
}

function applyKeyword(keyword) {
  appliedKeyword.value = keyword.trim();
  resetPage();
}

const applyKeywordDebounced = debounce(applyKeyword, PRODUCT_SEARCH_DEBOUNCE_MS);

function handleSearch() {
  applyKeywordDebounced.cancel();
  applyKeyword(searchInput.value);
}

function handleSecuritySearch() {
  appliedSecurityKeyword.value = securitySearchInput.value.trim();
  resetPage();
}

function handleSelectSecurityType(securityType) {
  selectedSecurityType.value = securityType;
  resetPage();
}

function handleOpenFilter() {
  isFilterOpen.value = true;
}

function handleApplyFilters(filters) {
  selectedSavingTerms.value = [...filters.savingTerms];
  selectedReserveTypes.value = [...filters.reserveTypes];
  selectedPreferentialConditions.value = [...filters.preferentialConditions];
  resetPage();
}

function handleClearFilters() {
  selectedSavingTerms.value = [];
  selectedReserveTypes.value = [];
  selectedPreferentialConditions.value = [];
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
    query: props.tradable ? { tradable: "true" } : undefined,
  });
}

function handleSelectSecurity(security) {
  if (emit("select-security", security) === false) return;
  router.push({
    name: "security-detail",
    params: { pk: security.ticker },
    query: props.tradable ? { tradable: "true" } : undefined,
  });
}

function handlePreviousPageGroup() {
  if (!hasPreviousPageGroup.value) return;
  currentPage.value = Math.max(pageGroupStart.value - VISIBLE_PAGE_COUNT, 1);
}

function handleNextPageGroup() {
  if (!hasNextPageGroup.value) return;
  currentPage.value = pageGroupStart.value + VISIBLE_PAGE_COUNT;
}

function handleSelectPage(page) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page;
}

// URL 쿼리 동기화 — standalone 모드에서만
function buildQueryFromState() {
  const query = {};
  if (activeTab.value !== defaultTab) query.tab = activeTab.value;

  if (appliedKeyword.value) query.keyword = appliedKeyword.value;
  if (appliedSecurityKeyword.value) {
    query.securityKeyword = appliedSecurityKeyword.value;
  }
  if (selectedSavingTerms.value.length) {
    query.savingTerms = selectedSavingTerms.value.map(String);
  }
  if (isSaving.value && selectedReserveTypes.value.length) {
    query.reserveTypes = [...selectedReserveTypes.value];
  }
  if (selectedPreferentialConditions.value.length) {
    query.preferentialConditions = [...selectedPreferentialConditions.value];
  }
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

// 가상투자 모드는 상품 상세를 다녀와도 탭이 유지되도록 tab만 URL에 남긴다.
function buildVirtualQueryFromState() {
  return activeTab.value === defaultTab ? {} : { tab: activeTab.value };
}

function syncQueryFromState() {
  const nextQuery = props.standalone
    ? buildQueryFromState()
    : buildVirtualQueryFromState();
  if (isQueryEqual(route.query, nextQuery)) return;
  router.replace({ query: nextQuery });
}

watch(searchInput, (value) => {
  applyKeywordDebounced(value);
});

watch(
  () => [
    activeTab.value,
    appliedKeyword.value,
    appliedSecurityKeyword.value,
    selectedSavingTerms.value,
    selectedReserveTypes.value,
    selectedPreferentialConditions.value,
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

onBeforeUnmount(() => {
  applyKeywordDebounced.cancel();
});
</script>

<template>
  <div class="flex flex-col gap-6" :class="standalone ? 'py-6' : ''">
    <PageHeader v-if="standalone">
      <h1 class="text-h1 text-ink">상품</h1>
      <p class="text-caption text-muted">
        나에게 맞는 예금·적금·증권 상품을 확인해 보세요.
      </p>
    </PageHeader>

    <BaseCard v-if="standalone" color="white" elevation="highlight">
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

    <div
      class="flex rounded-3xl bg-surface p-segment-p"
      aria-label="상품 유형"
    >
      <button
        v-for="option in LIST_TAB_OPTIONS"
        :key="option.key"
        type="button"
        :class="[
          activeTab === option.key
            ? 'bg-pink text-white'
            : 'text-ink',
          'flex-1 rounded-3xl px-4 py-3 text-button',
        ]"
        @click="handleSelectTab(option.key)"
      >
        {{ option.label }}
      </button>
    </div>

    <template v-if="!isSecurityTab">
      <form
        class="flex items-center gap-2 rounded-3xl bg-surface px-4"
        role="search"
        @submit.prevent="handleSearch"
      >
        <svg
          class="h-5 w-5 shrink-0 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke-width="2" />
          <path
            d="m16 16 4 4"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <input
          v-model="searchInput"
          type="search"
          class="min-w-0 flex-1 bg-transparent py-3 text-body text-ink outline-none"
          placeholder="은행명 또는 상품명 검색"
          aria-label="은행명 또는 상품명 검색"
          @keyup.enter="handleSearch"
        />
      </form>

      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <svg
              class="h-4 w-4 shrink-0 text-blue"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path
                class="text-white"
                d="M12 11v6M12 7.5v.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <p class="text-caption text-muted">
              금리는 은행 사정에 따라 변동될 수 있어요.
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <label
              class="relative flex cursor-pointer items-center gap-2 py-pill-y text-caption text-ink"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M8 18V6m0 0L5 9m3-3 3 3M16 6v12m0 0 3-3m-3 3-3-3"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>정렬</span>
              <select
                v-model="selectedSort"
                class="absolute inset-0 cursor-pointer opacity-0"
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
            </label>
            <button
              type="button"
              :class="[
                hasAppliedFilters
                  ? 'text-pink'
                  : 'text-ink',
                'flex items-center gap-2 py-pill-y text-caption',
              ]"
              :aria-label="`상품 필터${activeFilterCount ? ` ${activeFilterCount}개 적용 중` : ''}`"
              @click="handleOpenFilter"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M4 7h7m4 0h5M4 17h3m4 0h9"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
                <circle cx="13" cy="7" r="2" stroke-width="1.8" />
                <circle cx="9" cy="17" r="2" stroke-width="1.8" />
              </svg>
              <span>필터{{ activeFilterCount ? ` ${activeFilterCount}` : "" }}</span>
            </button>
          </div>
        </div>

        <div v-if="hasAppliedFilters" class="flex flex-wrap items-center gap-2">
          <BasePill
            v-for="label in activeFilterLabels"
            :key="label"
            :label="label"
            color="pink"
            variant="outline"
          />
          <button
            type="button"
            class="py-pill-y text-caption font-semibold text-muted"
            @click="handleClearFilters"
          >
            전체 초기화
          </button>
        </div>
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

    <div v-if="isSecurityTab" class="flex items-center justify-between gap-4">
      <p class="text-caption text-muted tabular-nums">
        {{ activeTabLabel }} {{ totalElements.toLocaleString("ko-KR") }}개
      </p>
    </div>

    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">
          {{ activeTabLabel }} 목록을 불러오는 중이에요
        </h2>
        <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
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
        variant="catalog"
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
      class="flex items-center justify-center gap-2"
      aria-label="상품 목록 페이지"
    >
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted disabled:opacity-50"
        aria-label="이전 페이지 묶음"
        :disabled="!hasPreviousPageGroup"
        @click="handlePreviousPageGroup"
      >
        <svg
          class="h-5 w-5"
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

      <button
        v-for="page in visiblePageNumbers"
        :key="page"
        type="button"
        :class="[
          currentPage === page
            ? 'bg-pink text-white'
            : 'bg-white text-muted',
          'flex h-10 w-10 items-center justify-center rounded-full text-button tabular-nums',
        ]"
        :aria-label="`${page}페이지`"
        :aria-current="currentPage === page ? 'page' : undefined"
        @click="handleSelectPage(page)"
      >
        {{ page }}
      </button>

      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted disabled:opacity-50"
        aria-label="다음 페이지 묶음"
        :disabled="!hasNextPageGroup"
        @click="handleNextPageGroup"
      >
        <svg
          class="h-5 w-5"
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

    <ProductFilterModal
      v-model="isFilterOpen"
      :product-type="activeTab"
      :saving-terms="selectedSavingTerms"
      :reserve-types="selectedReserveTypes"
      :preferential-conditions="selectedPreferentialConditions"
      @apply="handleApplyFilters"
    />
  </div>
</template>
