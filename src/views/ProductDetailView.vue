<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
  fetchProductDetail,
} from "@/api/productApi";
import ProductInterestOptionCard from "@/components/product/ProductInterestOptionCard.vue";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import { getProductTypeLabel } from "@/constants/product";
import { formatCurrency, formatNullableText } from "@/utils/format";

const route = useRoute();

const product = ref(null);
const isLoading = ref(false);
const errorState = ref(null);

const productTypeLabel = computed(() =>
  getProductTypeLabel(product.value?.productType ?? route.params.productType),
);

const productOptions = computed(() =>
  Array.isArray(product.value?.options) ? product.value.options : [],
);

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
      description: "현재 백엔드 인증 연결이 필요합니다.",
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

  try {
    product.value = await fetchProductDetail(
      route.params.productType,
      route.params.productId,
    );
  } catch (error) {
    errorState.value = getErrorState(error);
  } finally {
    isLoading.value = false;
  }
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

      <BaseCard v-else-if="errorState" color="pink">
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
        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
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

          <div v-if="productOptions.length" class="flex flex-col gap-4">
            <ProductInterestOptionCard
              v-for="option in productOptions"
              :key="option.productOptionId"
              :option="option"
            />
          </div>

          <BaseCard v-else color="blue">
            <div class="flex flex-col gap-2">
              <h3 class="text-h2 text-ink">등록된 금리 옵션이 없어요</h3>
              <p class="text-caption text-muted">
                상품의 금리 정보가 추가되면 이곳에 표시됩니다.
              </p>
            </div>
          </BaseCard>
        </section>

        <section class="flex flex-col gap-4">
          <h2 class="text-h2 text-ink">상품 안내</h2>

          <BaseCard color="pink">
            <div class="flex flex-col gap-2">
              <h3 class="text-h2 text-ink">우대 조건</h3>
              <p class="whitespace-pre-line text-body text-ink">
                {{ formatNullableText(product.preferentialConditions) }}
              </p>
            </div>
          </BaseCard>

          <BaseCard color="blue">
            <div class="flex flex-col gap-2">
              <h3 class="text-h2 text-ink">만기 후 이자율 안내</h3>
              <p class="whitespace-pre-line text-body text-ink">
                {{ formatNullableText(product.maturityInterestDescription) }}
              </p>
            </div>
          </BaseCard>

          <BaseCard color="yellow">
            <div class="flex flex-col gap-2">
              <h3 class="text-h2 text-ink">기타 유의사항</h3>
              <p class="whitespace-pre-line text-body text-ink">
                {{ formatNullableText(product.additionalNote) }}
              </p>
            </div>
          </BaseCard>
        </section>
      </template>
    </div>
  </PageContainer>
</template>
