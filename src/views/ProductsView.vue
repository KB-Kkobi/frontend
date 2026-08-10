<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
  fetchProductList,
} from "@/api/productApi";
import ProductListCard from "@/components/product/ProductListCard.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import {
  PRODUCT_LIST_DEFAULTS,
  PRODUCT_SORT_OPTIONS,
  PRODUCT_TYPES,
  PRODUCT_TYPE_OPTIONS,
  RESERVE_TYPE_OPTIONS,
  SAVING_TERM_OPTIONS,
  getProductTypeLabel,
  normalizeProductType,
} from "@/constants/product";

const router = useRouter();

const activeProductType = ref(PRODUCT_TYPES.DEPOSIT);
const searchInput = ref("");
const appliedKeyword = ref("");
const selectedSavingTerm = ref(PRODUCT_LIST_DEFAULTS.savingTerm);
const selectedReserveType = ref("");
const selectedSort = ref(PRODUCT_LIST_DEFAULTS.sort);
const currentPage = ref(PRODUCT_LIST_DEFAULTS.page);
const products = ref([]);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");

const activeProductTypeLabel = computed(() =>
  getProductTypeLabel(activeProductType.value),
);

const isSaving = computed(
  () => activeProductType.value === PRODUCT_TYPES.SAVING,
);

const hasPreviousPage = computed(() => currentPage.value > 1);
const hasNextPage = computed(() => currentPage.value < totalPages.value);

function getListErrorMessage(error) {
  if (
    error instanceof ProductApiError &&
    error.code === PRODUCT_API_ERROR_CODES.UNAUTHORIZED
  ) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
  }
  if (error instanceof ProductApiError) return error.message;
  return "상품 목록을 불러오지 못했습니다.";
}

async function loadProducts() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchProductList(activeProductType.value, {
      keyword: appliedKeyword.value,
      savingTerm: selectedSavingTerm.value,
      reserveType: isSaving.value ? selectedReserveType.value : "",
      page: currentPage.value,
      size: PRODUCT_LIST_DEFAULTS.size,
      sort: selectedSort.value,
    });

    products.value = response.content;
    currentPage.value = response.page;
    totalElements.value = response.totalElements;
    totalPages.value = response.totalPages;
  } catch (error) {
    products.value = [];
    totalElements.value = 0;
    totalPages.value = 0;
    errorMessage.value = getListErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

function resetPage() {
  currentPage.value = PRODUCT_LIST_DEFAULTS.page;
}

function handleSelectProductType(productType) {
  activeProductType.value = productType;
  selectedReserveType.value = "";
  resetPage();
}

function handleSearch() {
  appliedKeyword.value = searchInput.value.trim();
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

function handleSelectProduct(product) {
  router.push({
    name: "product-detail",
    params: {
      productType: normalizeProductType(product.productType),
      productId: product.productId,
    },
  });
}

function handlePreviousPage() {
  if (hasPreviousPage.value) currentPage.value -= 1;
}

function handleNextPage() {
  if (hasNextPage.value) currentPage.value += 1;
}

watch(
  () => [
    activeProductType.value,
    appliedKeyword.value,
    selectedSavingTerm.value,
    selectedReserveType.value,
    selectedSort.value,
    currentPage.value,
  ],
  loadProducts,
  { immediate: true },
);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="flex flex-col gap-2 text-center">
        <h1 class="text-h1 text-ink">상품</h1>
        <p class="text-caption text-muted">
          나에게 맞는 예금·적금 상품을 확인해 보세요.
        </p>
      </header>

      <BaseCard color="yellow">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">성향 배치할 곳</h2>
          <p class="text-caption text-muted">
            추후 사용자 투자 성향 정보가 표시됩니다.
          </p>
        </div>
      </BaseCard>

      <div class="flex gap-2" aria-label="상품 유형">
        <button
          v-for="option in PRODUCT_TYPE_OPTIONS"
          :key="option.key"
          type="button"
          :class="[
            activeProductType === option.key
              ? 'bg-pink text-white'
              : 'border border-line bg-white text-muted',
            'flex-1 rounded-2xl px-4 py-3 text-button',
          ]"
          @click="handleSelectProductType(option.key)"
        >
          {{ option.label }}
        </button>
      </div>

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

      <div class="flex items-center justify-between gap-4">
        <p class="text-caption text-muted tabular-nums">
          {{ activeProductTypeLabel }} {{ totalElements.toLocaleString("ko-KR") }}개
        </p>
        <select
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
          <h2 class="text-h2 text-ink">상품 목록을 불러오는 중이에요</h2>
          <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
        </div>
      </BaseCard>

      <BaseCard v-else-if="errorMessage" color="pink">
        <div class="flex flex-col gap-4" role="alert">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">상품 목록을 불러오지 못했어요</h2>
            <p class="text-caption text-muted">{{ errorMessage }}</p>
          </div>
          <BottomButton color="white" @click="loadProducts">
            다시 시도하기
          </BottomButton>
        </div>
      </BaseCard>

      <div v-else-if="products.length" class="flex flex-col gap-4">
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
            검색어나 가입 기간을 바꿔 다시 확인해 주세요.
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
  </PageContainer>
</template>
