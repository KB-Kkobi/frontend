<script setup>
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchLatestAssessment } from "@/api/assessmentApi";
import { ApiError, resolveApiUrl } from "@/api/http";
import { fetchPersonas } from "@/api/personaApi";
import { PERSONA_RECOMMEND_REASONS } from "@/constants/persona";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
  fetchProductList,
} from "@/api/productApi";
import { fetchSecurityList, fetchSecurityQuotes } from "@/api/securityApi";
import ProductListCard from "@/components/product/ProductListCard.vue";
import FilterSheet from "@/components/common/FilterSheet.vue";
import SecurityListCard from "@/components/security/SecurityListCard.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import HelpButton from "@/components/common/HelpButton.vue";
import BasePill from "@/components/common/BasePill.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import NotificationBellButton from "@/components/notification/NotificationBellButton.vue";
import ListToolbar from "@/components/common/ListToolbar.vue";
import BasePagination from "@/components/common/BasePagination.vue";
import SearchInput from "@/components/common/SearchInput.vue";
import {
  PREFERENTIAL_CONDITION_OPTIONS,
  PRODUCT_LIST_TABS,
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
  SECURITY_FILTER_TYPE_OPTIONS,
  SECURITY_LIST_DEFAULTS,
  SECURITY_SORT_OPTIONS,
} from "@/constants/security";
import {
  SECURITY_FILTER_GROUPS,
  buildSavingsFilterGroups,
} from "@/constants/productFilters";
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

const LIST_TAB_OPTIONS = Object.freeze([
  { key: PRODUCT_LIST_TABS.SECURITY, label: "주식" },
  { key: PRODUCT_LIST_TABS.DEPOSIT, label: "예금" },
  { key: PRODUCT_LIST_TABS.SAVING, label: "적금" },
]);
const router = useRouter();
const route = useRoute();

const TAB_KEYS = new Set(Object.values(PRODUCT_LIST_TABS));

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

// 클릭 순서와 무관하게 항상 오름차순으로 유지한다(선택 pill 표시·API 요청 순서 포함).
function sortSavingTerms(savingTerms) {
  return [...savingTerms].sort((a, b) => a - b);
}

function parseInitialSavingTerms(query) {
  return sortSavingTerms(
    parseInitialList(query.savingTerms ?? query.savingTerm)
      .map(Number)
      .filter((savingTerm) => SAVING_TERM_OPTIONS.includes(savingTerm)),
  );
}

function parseInitialOptionValues(value, options) {
  const allowedValues = new Set(options.map((option) => option.value));
  return parseInitialList(value).filter((item) => allowedValues.has(item));
}

const initialQuery = route.query;
// 상품 탭은 독립/가상투자 모드 모두 주식 탭을 먼저 보여준다.
const defaultTab = PRODUCT_LIST_TABS.SECURITY;
const initialSavingTerms = parseInitialSavingTerms(initialQuery);

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
const selectedSort = ref(
  String(initialQuery.sort ?? PRODUCT_LIST_DEFAULTS.sort),
);
const selectedSecurityTypes = ref(
  parseInitialOptionValues(
    initialQuery.securityTypes,
    SECURITY_FILTER_TYPE_OPTIONS,
  ),
);
const selectedSecuritySort = ref(
  String(initialQuery.securitySort ?? SECURITY_LIST_DEFAULTS.sort),
);
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
const isSecurityFilterOpen = ref(false);
const showMatchInfoModal = ref(false);
const hasAssessment = computed(() => latestAssessment.value !== null);
const recommendReason = computed(
  () => PERSONA_RECOMMEND_REASONS[latestAssessment.value?.personaCode] ?? "",
);

const isSecurityTab = computed(
  () => activeTab.value === PRODUCT_LIST_TABS.SECURITY,
);
const isSaving = computed(
  () => activeTab.value === PRODUCT_LIST_TABS.SAVING,
);

const activeTabLabel = computed(() =>
  isSecurityTab.value ? "주식" : getProductTypeLabel(activeTab.value),
);

const activeFilterCount = computed(
  () =>
    selectedSavingTerms.value.length +
    (isSaving.value ? selectedReserveTypes.value.length : 0) +
    selectedPreferentialConditions.value.length,
);
const hasAppliedFilters = computed(() => activeFilterCount.value > 0);
const securityActiveFilterCount = computed(
  () => selectedSecurityTypes.value.length,
);
const hasAppliedSecurityFilters = computed(
  () => securityActiveFilterCount.value > 0,
);
const securityFilterModelValue = computed(() => ({
  securityTypes: selectedSecurityTypes.value,
}));
const filterGroups = computed(() => buildSavingsFilterGroups(isSaving.value));
const filterModelValue = computed(() => ({
  savingTerms: selectedSavingTerms.value,
  reserveTypes: selectedReserveTypes.value,
  preferentialConditions: selectedPreferentialConditions.value,
}));
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
      : SAVING_TERM_OPTIONS,
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
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
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
    types: selectedSecurityTypes.value,
    keyword: appliedSecurityKeyword.value,
    page: currentPage.value,
    size: SECURITY_LIST_DEFAULTS.size,
    sort: selectedSecuritySort.value,
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
  selectedSecurityTypes.value = [];
  securitySearchInput.value = "";
  appliedSecurityKeyword.value = "";
  resetPage();
}

function syncActiveTabFromRoute() {
  const nextTab = parseInitialTab(route.query.tab, defaultTab);
  if (activeTab.value === nextTab) return;
  handleSelectTab(nextTab);
}

function applyKeyword(keyword) {
  appliedKeyword.value = keyword.trim();
  resetPage();
}

const applyKeywordDebounced = debounce(
  applyKeyword,
  PRODUCT_SEARCH_DEBOUNCE_MS,
);

function handleSearch() {
  applyKeywordDebounced.cancel();
  applyKeyword(searchInput.value);
}

function applySecurityKeyword(keyword) {
  appliedSecurityKeyword.value = keyword.trim();
  resetPage();
}

const applySecurityKeywordDebounced = debounce(
  applySecurityKeyword,
  PRODUCT_SEARCH_DEBOUNCE_MS,
);

function handleSecuritySearch() {
  applySecurityKeywordDebounced.cancel();
  applySecurityKeyword(securitySearchInput.value);
}

function handleOpenFilter() {
  isFilterOpen.value = true;
}

function handleOpenSecurityFilter() {
  isSecurityFilterOpen.value = true;
}

function handleApplySecurityFilters(filters) {
  selectedSecurityTypes.value = [...(filters.securityTypes ?? [])];
  resetPage();
}

function handleApplyFilters(filters) {
  selectedSavingTerms.value = sortSavingTerms(filters.savingTerms ?? []);
  selectedReserveTypes.value = [...(filters.reserveTypes ?? [])];
  selectedPreferentialConditions.value = [
    ...(filters.preferentialConditions ?? []),
  ];
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

  // 상세 화면에서 가입기간 탭의 기본 선택값을 정할 때 쓰도록, 목록에 적용된
  // 기간 필터를 그대로 넘겨준다. 상세는 이 값이 없거나 상품에 없는 기간이면
  // 스스로 가장 짧은 기간을 기본 선택한다.
  const query = {};
  if (props.tradable) query.tradable = "true";
  if (selectedSavingTerms.value.length) {
    query.savingTerms = selectedSavingTerms.value.map(String);
  }

  router.push({
    name: "product-detail",
    params: {
      productType: normalizeProductType(product.productType),
      productId: product.productId,
    },
    query: Object.keys(query).length ? query : undefined,
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
  if (selectedSecurityTypes.value.length) {
    query.securityTypes = [...selectedSecurityTypes.value];
  }
  if (selectedSecuritySort.value !== SECURITY_LIST_DEFAULTS.sort) {
    query.securitySort = selectedSecuritySort.value;
  }
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

watch(securitySearchInput, (value) => {
  applySecurityKeywordDebounced(value);
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
    selectedSecurityTypes.value,
    selectedSecuritySort.value,
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

// 가상투자 화면은 keep-alive 대상이므로 재진입할 때 URL이 요청한 탭을 다시 반영한다.
onActivated(() => {
  if (!props.standalone) syncActiveTabFromRoute();
});

onBeforeUnmount(() => {
  applyKeywordDebounced.cancel();
  applySecurityKeywordDebounced.cancel();
});
</script>

<template>
  <div class="flex flex-col gap-6" :class="standalone ? 'py-6' : ''">
    <PageHeader v-if="standalone">
      <template #actions>
        <NotificationBellButton />
      </template>
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
          <p v-if="recommendReason" class="text-caption text-pink">
            {{ recommendReason }}
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

    <div class="flex rounded-3xl bg-surface p-segment-p" aria-label="상품 유형">
      <button
        v-for="option in LIST_TAB_OPTIONS"
        :key="option.key"
        type="button"
        :class="[
          activeTab === option.key ? 'bg-pink text-white' : 'text-ink',
          'flex-1 rounded-3xl px-4 py-3 text-button',
        ]"
        @click="handleSelectTab(option.key)"
      >
        {{ option.label }}
      </button>
    </div>

    <template v-if="!isSecurityTab">
      <template v-if="standalone">
        <SearchInput
          v-model="searchInput"
          placeholder="은행명 또는 상품명 검색"
          @search="handleSearch"
        />

        <div class="flex flex-col gap-4">
          <ListToolbar
            :filter-active="hasAppliedFilters"
            :filter-count="activeFilterCount"
            @filter="handleOpenFilter"
          >
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
            <template #sort>
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
            </template>
          </ListToolbar>

          <div
            v-if="hasAppliedFilters"
            class="flex flex-wrap items-center gap-2"
          >
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
        <SearchInput
          v-model="searchInput"
          variant="outline"
          placeholder="은행명 또는 상품명 검색"
          @search="handleSearch"
        />

        <div class="flex flex-col gap-4">
          <ListToolbar
            :filter-active="hasAppliedFilters"
            :filter-count="activeFilterCount"
            @filter="handleOpenFilter"
          >
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
            <template #sort>
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
            </template>
          </ListToolbar>

          <div
            v-if="hasAppliedFilters"
            class="flex flex-wrap items-center gap-2"
          >
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
    </template>

    <template v-else>
      <SearchInput
        v-model="securitySearchInput"
        variant="outline"
        placeholder="종목명 검색"
        @search="handleSecuritySearch"
      />

      <ListToolbar
        :filter-active="hasAppliedSecurityFilters"
        :filter-count="securityActiveFilterCount"
        @filter="handleOpenSecurityFilter"
      >
        <div class="flex items-center gap-2">
          <span class="text-caption text-muted">성향 적합도</span>
          <HelpButton
            aria-label="성향 적합도 설명 보기"
            @click="showMatchInfoModal = true"
          />
        </div>
        <template #sort>
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
              v-model="selectedSecuritySort"
              class="absolute inset-0 cursor-pointer opacity-0"
              aria-label="종목 정렬"
              @change="resetPage"
            >
              <option
                v-for="sortOption in SECURITY_SORT_OPTIONS"
                :key="sortOption.value"
                :value="sortOption.value"
              >
                {{ sortOption.label }}
              </option>
            </select>
          </label>
        </template>
      </ListToolbar>

      <!-- 성향 적합도 안내 모달 -->
      <BaseModal
        v-model="showMatchInfoModal"
        message="성향 적합도란?"
        confirm-text="확인"
        :show-cancel="false"
      >
        <template #content>
          <div class="flex flex-col gap-4 text-body text-ink tracking-tight">
            <p>
              성향 적합도는 내 투자 성향과 종목의 특성을 비교해 얼마나 잘 맞는지를
              나타내는 수치예요.
            </p>
            <p>100%에 가까울수록 내 성향과 잘 맞는 종목이에요.</p>
            <p class="text-caption text-muted">
              단, 성향 적합도가 높다고 수익률이 높은 건 아니에요. 성향이 얼마나
              비슷한지를 나타낼 뿐, 투자 결과를 보장하지 않아요.
            </p>
            <p
              v-if="!hasAssessment"
              class="border-t border-line-soft pt-4 text-caption text-muted"
            >
              성향 진단을 완료하면 각 종목의 성향 적합도를 바로 확인할 수 있어요.
            </p>
          </div>
        </template>
      </BaseModal>
    </template>

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

    <BasePagination
      v-if="!isLoading && !errorMessage && totalPages > 1"
      v-model:current-page="currentPage"
      :total-pages="totalPages"
    />

    <FilterSheet
      v-model:open="isFilterOpen"
      :model-value="filterModelValue"
      :groups="filterGroups"
      @apply="handleApplyFilters"
    />

    <FilterSheet
      v-model:open="isSecurityFilterOpen"
      :model-value="securityFilterModelValue"
      :groups="SECURITY_FILTER_GROUPS"
      @apply="handleApplySecurityFilters"
    />
  </div>
</template>
