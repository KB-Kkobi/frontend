<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchLatestAssessment } from "@/api/assessmentApi";
import { ApiError } from "@/api/http";
import {
  fetchProductTerminationEstimate,
  terminateProduct,
} from "@/api/productApi";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BasePill from "@/components/common/BasePill.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import ProductAssetRatioChangeCard from "@/components/product/ProductAssetRatioChangeCard.vue";
import ProductTerminationComparisonCard from "@/components/product/ProductTerminationComparisonCard.vue";
import {
  PRODUCT_TYPES,
  getProductTypeLabel,
  normalizeProductType,
} from "@/constants/product";
import { formatLocalDate } from "@/utils/date";
import {
  formatCurrency,
  formatInterestRate,
  formatNullableText,
} from "@/utils/format";

const route = useRoute();
const router = useRouter();

const estimate = ref(null);
const recommendedSavingsRatio = ref(null);
const isLoading = ref(false);
const isTerminating = ref(false);
const errorMessage = ref("");
const terminationErrorMessage = ref("");
const isConfirmationOpen = ref(false);

const isSaving = computed(
  () => normalizeProductType(estimate.value?.productType) === PRODUCT_TYPES.SAVING,
);
const productTypeLabel = computed(() =>
  getProductTypeLabel(estimate.value?.productType),
);
const pageTitle = computed(() => `${productTypeLabel.value} 해지`);
const progressRate = computed(() => {
  const rate = Number(estimate.value?.maturityProgressRate);
  if (!Number.isFinite(rate)) return 0;
  return Math.min(100, Math.max(0, rate));
});
const confirmationMessage = computed(
  () =>
    `정말 ${estimate.value?.productName ?? "이 상품"}을 해지하시겠습니까? 해지 후에는 되돌릴 수 없습니다.`,
);

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "해지 예상 정보를 불러오지 못했습니다.";
}

async function loadRecommendedRatio() {
  try {
    const assessment = await fetchLatestAssessment();
    recommendedSavingsRatio.value =
      assessment?.recommendedRatio?.depositRatio ?? null;
  } catch {
    recommendedSavingsRatio.value = null;
  }
}

async function loadTerminationEstimate() {
  isLoading.value = true;
  errorMessage.value = "";
  terminationErrorMessage.value = "";
  estimate.value = null;

  try {
    estimate.value = await fetchProductTerminationEstimate(
      route.params.holdingProductId,
    );
    await loadRecommendedRatio();
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

function handleKeepProduct() {
  router.push({
    name: "product-holding-detail",
    params: { holdingProductId: route.params.holdingProductId },
  });
}

async function handleTerminate() {
  if (isTerminating.value) return;

  isTerminating.value = true;
  terminationErrorMessage.value = "";

  try {
    await terminateProduct(route.params.holdingProductId);
    await router.replace({
      name: "virtual-assets",
      query: { terminated: "true" },
    });
  } catch (error) {
    terminationErrorMessage.value = getErrorMessage(error);
  } finally {
    isTerminating.value = false;
  }
}

watch(
  () => route.params.holdingProductId,
  loadTerminationEstimate,
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col gap-4 pb-6">
    <header class="flex items-center gap-2">
      <BackButton />
      <h1 class="text-h1 text-ink">{{ pageTitle }}</h1>
    </header>

    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">해지 예상 금액을 계산하고 있어요</h2>
        <p class="text-caption text-muted">서버에 저장된 가입 정보를 확인하고 있습니다.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">해지 예상 정보를 확인할 수 없어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadTerminationEstimate">
          다시 시도하기
        </BottomButton>
      </div>
    </BaseCard>

    <template v-else-if="estimate">
      <BaseCard color="white" elevation="highlight">
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex min-w-0 items-center gap-4">
              <span
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-soft text-h2 text-pink"
                aria-hidden="true"
              >
                {{ estimate.financialCompanyName?.charAt(0) || "금" }}
              </span>
              <div class="flex min-w-0 flex-col gap-2">
                <p class="text-caption text-muted">
                  {{ formatNullableText(estimate.financialCompanyName) }}
                </p>
                <h2 class="text-h2 text-ink">
                  {{ formatNullableText(estimate.productName) }}
                </h2>
                <p class="text-caption text-muted tabular-nums">
                  {{ isSaving ? `월 ${formatCurrency(estimate.joinAmount)}` : `${estimate.savingTerm}개월` }}
                  · 연 {{ formatInterestRate(estimate.appliedRate) }}
                </p>
              </div>
            </div>
            <BasePill label="가입 중" color="green" />
          </div>

          <div class="flex flex-col gap-2 border-t border-line pt-4">
            <div class="flex items-center justify-between gap-4 text-caption text-muted">
              <span>가입 {{ formatLocalDate(estimate.startDate) }}</span>
              <span>만기 {{ formatLocalDate(estimate.maturityDate) }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-surface">
              <div
                class="h-full rounded-full bg-pink"
                :style="{ width: `${progressRate}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between gap-4 text-caption tabular-nums">
              <span v-if="isSaving" class="text-profit">
                {{ estimate.paidInstallments ?? 0 }}회 납입 완료
              </span>
              <span v-else class="text-muted">{{ progressRate.toFixed(1) }}% 경과</span>
              <span class="text-yellow">{{ estimate.remainingDays }}일 남음</span>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard color="yellow">
        <div class="flex gap-4">
          <span class="text-h2 text-error" aria-hidden="true">!</span>
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-error">아직 만기가 아니에요</h2>
            <p class="text-caption text-muted">
              지금 해지하면 만기까지 유지할 때보다 받을 수 있는 이자가 줄어들어요.
            </p>
          </div>
        </div>
      </BaseCard>

      <ProductTerminationComparisonCard
        :estimate="estimate"
        :is-saving="isSaving"
      />

      <ProductAssetRatioChangeCard
        :current-ratio="estimate.currentSavingsRatio"
        :after-ratio="estimate.afterTerminationSavingsRatio"
        :recommended-ratio="recommendedSavingsRatio"
      />

      <p
        v-if="terminationErrorMessage"
        class="text-caption text-error"
        role="alert"
      >
        {{ terminationErrorMessage }}
      </p>

      <div class="sticky bottom-20 flex gap-2 bg-base py-4">
        <BottomButton
          color="danger"
          :disabled="isTerminating"
          @click="isConfirmationOpen = true"
        >
          해지하기
        </BottomButton>
        <BottomButton color="pink" @click="handleKeepProduct">
          유지하기
        </BottomButton>
      </div>
    </template>
  </div>

  <BaseModal
    v-model="isConfirmationOpen"
    :message="confirmationMessage"
    confirm-text="해지하기"
    cancel-text="유지하기"
    @confirm="handleTerminate"
  />
</template>
