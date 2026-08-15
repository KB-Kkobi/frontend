<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
  fetchProductDetail,
} from "@/api/productApi";
import ProductBankLogo from "@/components/product/ProductBankLogo.vue";
import ProductInterestOptionCard from "@/components/product/ProductInterestOptionCard.vue";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import { getProductTypeLabel } from "@/constants/product";
import { formatCurrency, formatNullableText } from "@/utils/format";

const route = useRoute();
const router = useRouter();

const product = ref(null);
const isLoading = ref(false);
const errorState = ref(null);
const selectedOptionId = ref(null);

const isVirtualInvestment = computed(() => route.query.tradable === "true");

const productTypeLabel = computed(() =>
  getProductTypeLabel(product.value?.productType ?? route.params.productType),
);

const productOptions = computed(() =>
  Array.isArray(product.value?.options) ? product.value.options : [],
);
// 가입기간 탭은 항상 오름차순으로 보여준다.
const sortedProductOptions = computed(() =>
  [...productOptions.value].sort(
    (a, b) => (a.savingTerm ?? 0) - (b.savingTerm ?? 0),
  ),
);
// 자유적립식/정액적립식처럼 같은 가입기간에 옵션이 여러 개 있는 상품도
// 가입기간 탭에는 기간별로 한 번만 노출한다(탭 중복 방지).
const optionGroupsByTerm = computed(() => {
  const groups = [];
  sortedProductOptions.value.forEach((option) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.savingTerm === option.savingTerm) {
      lastGroup.options.push(option);
      return;
    }
    groups.push({ savingTerm: option.savingTerm, options: [option] });
  });
  return groups;
});
const selectedOption = computed(
  () =>
    productOptions.value.find(
      (option) => option.productOptionId === selectedOptionId.value,
    ) ?? null,
);
// 선택된 기간에 속한 옵션들. 자유적립식/정액적립식처럼 옵션이 2개 이상이면
// 적립유형을 고를 수 있는 보조 선택지를 보여준다.
const selectedTermOptions = computed(() => {
  if (!selectedOption.value) return [];
  const group = optionGroupsByTerm.value.find(
    (item) => item.savingTerm === selectedOption.value.savingTerm,
  );
  return group?.options ?? [];
});
const hasReserveTypeChoice = computed(() => selectedTermOptions.value.length > 1);

const isSubscribeDisabled = computed(() =>
  isVirtualInvestment.value ? !productOptions.value.length : !product.value?.applyUrl,
);

// 목록에서 적용했던 기간 필터(savingTerms 쿼리)를 상세의 기본 선택 기준으로 쓴다.
// 필터에 해당하는 기간이 상품에 없으면 가장 짧은 기간을 기본 선택한다.
function parseFilterTerms() {
  const raw = route.query.savingTerms;
  if (raw === null || raw === undefined || raw === "") return [];
  const values = Array.isArray(raw) ? raw : [raw];
  return values
    .flatMap((value) => String(value).split(","))
    .map(Number)
    .filter(Number.isFinite);
}

function pickDefaultOptionId() {
  const sorted = sortedProductOptions.value;
  if (!sorted.length) return null;

  const filterTerms = parseFilterTerms();
  if (filterTerms.length) {
    const matched = sorted.find((option) =>
      filterTerms.includes(option.savingTerm),
    );
    if (matched) return matched.productOptionId;
  }

  return sorted[0].productOptionId;
}

function handleSelectTerm(group) {
  selectedOptionId.value = group.options[0]?.productOptionId ?? null;
}

function handleSelectReserveType(option) {
  selectedOptionId.value = option.productOptionId;
}

function getErrorState(error) {
  if (!(error instanceof ProductApiError)) {
    return {
      title: "상품 정보를 불러오지 못했어요",
      description: "잠시 후 다시 시도해 주세요.",
    };
  }

  if (
    error.code === PRODUCT_API_ERROR_CODES.NOT_FOUND ||
    error.code === PRODUCT_API_ERROR_CODES.INVALID_ID
  ) {
    return {
      title: "상품을 찾을 수 없어요",
      description: "상품 유형과 상품 ID를 다시 확인해 주세요.",
    };
  }

  if (error.code === PRODUCT_API_ERROR_CODES.INVALID_TYPE) {
    return {
      title: "지원하지 않는 상품 유형이에요",
      description: "예금 또는 적금 상품으로 다시 이동해 주세요.",
    };
  }

  if (error.code === PRODUCT_API_ERROR_CODES.UNAUTHORIZED) {
    return {
      title: "상품 정보를 조회할 수 없어요",
      description: "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.",
    };
  }

  return {
    title: "상품 정보를 불러오지 못했어요",
    description: error.message,
  };
}

async function loadProductDetail() {
  isLoading.value = true;
  product.value = null;
  errorState.value = null;
  selectedOptionId.value = null;

  try {
    product.value = await fetchProductDetail(
      route.params.productType,
      route.params.productId,
    );
    selectedOptionId.value = pickDefaultOptionId();
  } catch (error) {
    errorState.value = getErrorState(error);
  } finally {
    isLoading.value = false;
  }
}

function handleSubscribe() {
  if (isVirtualInvestment.value) {
    router.push({
      name: "product-subscribe",
      params: {
        productType: route.params.productType,
        productId: route.params.productId,
      },
      // 가입 화면에서도 가상투자 바텀탭이 유지되도록 컨텍스트를 넘긴다.
      query: { tradable: "true" },
    });
    return;
  }

  if (!product.value?.applyUrl) {
    return;
  }

  window.open(product.value.applyUrl, "_blank", "noopener,noreferrer");
}

watch(
  () => [route.params.productType, route.params.productId],
  loadProductDetail,
  { immediate: true },
);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="flex items-center gap-2">
        <BackButton />
        <h1 class="text-h1 text-ink">상품 상세</h1>
      </header>

      <BaseCard v-if="isLoading" color="blue">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">상품 정보를 불러오는 중이에요</h2>
          <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
        </div>
      </BaseCard>

      <BaseCard v-else-if="errorState" color="white" elevation="flat">
        <div class="flex flex-col gap-4" role="alert">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">{{ errorState.title }}</h2>
            <p class="text-caption text-muted">
              {{ errorState.description }}
            </p>
          </div>
          <BottomButton color="white" @click="loadProductDetail">
            다시 시도하기
          </BottomButton>
        </div>
      </BaseCard>

      <template v-else-if="product">
        <BaseCard color="white" elevation="highlight">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <ProductBankLogo :name="product.financialCompanyName" />
              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <p class="text-caption font-semibold text-pink">
                  {{ productTypeLabel }}
                </p>
                <p class="text-caption text-muted">
                  {{ formatNullableText(product.financialCompanyName) }}
                </p>
                <h2 class="text-h1 text-ink">
                  {{ formatNullableText(product.productName) }}
                </h2>
              </div>
            </div>

            <dl class="flex flex-col gap-4 border-t border-line pt-4">
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">가입 방법</dt>
                <dd class="text-body text-ink">
                  {{ formatNullableText(product.joinWay) }}
                </dd>
              </div>

              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">가입 대상</dt>
                <dd class="text-body text-ink">
                  {{ formatNullableText(product.joinMember) }}
                </dd>
              </div>

              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">최고 가입 한도</dt>
                <dd class="text-body text-ink tabular-nums">
                  {{ formatCurrency(product.maxLimit) }}
                </dd>
              </div>
            </dl>
          </div>
        </BaseCard>

        <section class="flex flex-col gap-4">
          <h2 class="text-h2 text-ink">금리 옵션</h2>

          <template v-if="optionGroupsByTerm.length">
            <div
              class="flex flex-wrap gap-2"
              role="tablist"
              aria-label="가입 기간"
            >
              <BasePill
                v-for="group in optionGroupsByTerm"
                :key="group.savingTerm"
                as="button"
                type="button"
                role="tab"
                :label="`${group.savingTerm}개월`"
                color="pink"
                :variant="selectedOption?.savingTerm === group.savingTerm ? 'filled' : 'ghost'"
                :aria-selected="selectedOption?.savingTerm === group.savingTerm"
                @click="handleSelectTerm(group)"
              />
            </div>

            <div
              v-if="hasReserveTypeChoice"
              class="flex flex-wrap gap-2"
              role="tablist"
              aria-label="적립 유형"
            >
              <BasePill
                v-for="option in selectedTermOptions"
                :key="option.productOptionId"
                as="button"
                type="button"
                role="tab"
                :label="option.reserveTypeName"
                color="yellow"
                :variant="selectedOptionId === option.productOptionId ? 'filled' : 'ghost'"
                :aria-selected="selectedOptionId === option.productOptionId"
                @click="handleSelectReserveType(option)"
              />
            </div>

            <Transition name="term-option" mode="out-in">
              <ProductInterestOptionCard
                v-if="selectedOption"
                :key="selectedOption.productOptionId"
                :option="selectedOption"
              />
            </Transition>
          </template>

          <BaseCard v-else color="blue">
            <div class="flex flex-col gap-2">
              <h3 class="text-h2 text-ink">등록된 금리 옵션이 없어요</h3>
              <p class="text-caption text-muted">
                상품의 금리 정보가 추가되면 이곳에 표시됩니다.
              </p>
            </div>
          </BaseCard>
        </section>

        <section class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">상품 안내</h2>

          <BaseCard color="blue">
            <div class="flex flex-col gap-2">
              <h3 class="text-body font-semibold text-ink">만기 후 이자율 안내</h3>
              <p class="whitespace-pre-line text-caption text-ink">
                {{ formatNullableText(product.maturityInterestDescription) }}
              </p>
            </div>
          </BaseCard>

          <BaseCard color="yellow">
            <div class="flex flex-col gap-2">
              <h3 class="text-body font-semibold text-ink">기타 유의사항</h3>
              <p class="whitespace-pre-line text-caption text-ink">
                {{ formatNullableText(product.additionalNote) }}
              </p>
            </div>
          </BaseCard>
        </section>

        <BottomButton
          :disabled="isSubscribeDisabled"
          @click="handleSubscribe"
        >
          {{ isVirtualInvestment ? "이 상품 가입하기" : "이 상품 보러가기" }}
        </BottomButton>
      </template>
    </div>
  </PageContainer>
</template>

<style scoped>
.term-option-enter-active,
.term-option-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.term-option-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.term-option-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
