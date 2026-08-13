<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/api/http";
import { fetchProductHolding } from "@/api/productApi";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import {
  PRODUCT_TYPES,
  getProductHoldingStatus,
  getProductTypeLabel,
  normalizeProductType,
} from "@/constants/product";
import { formatLocalDate } from "@/utils/date";
import {
  formatCurrency,
  formatInterestRate,
  formatNullableText,
  formatSignedCurrency,
} from "@/utils/format";

const route = useRoute();
const router = useRouter();

const holding = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");

const isSaving = computed(
  () => normalizeProductType(holding.value?.productType) === PRODUCT_TYPES.SAVING,
);
const productTypeLabel = computed(() =>
  getProductTypeLabel(holding.value?.productType),
);
const pageTitle = computed(() => `${productTypeLabel.value} 상세`);
const productSummaryLabel = computed(() => {
  const summary = [productTypeLabel.value];
  const savingTerm = Number(holding.value?.savingTerm);
  if (Number.isInteger(savingTerm) && savingTerm > 0) {
    summary.push(`${savingTerm}개월`);
  }
  summary.push(formatInterestRate(holding.value?.appliedRate));
  return summary.join(" · ");
});
const status = computed(() => getProductHoldingStatus(holding.value?.status));
const progressRate = computed(() => {
  const rate = Number(holding.value?.maturityProgressRate);
  if (!Number.isFinite(rate)) return 0;
  return Math.min(100, Math.max(0, rate));
});
const remainingDaysLabel = computed(() => {
  const remainingDays = Number(holding.value?.remainingDays);
  if (!Number.isFinite(remainingDays)) return "만기까지 남은 기간을 확인할 수 없어요.";
  if (remainingDays <= 0) return "만기일이 도래했어요.";
  return `만기까지 ${remainingDays.toLocaleString("ko-KR")}일 남았어요.`;
});
const evaluationGain = computed(() => {
  const currentValue = Number(holding.value?.currentValue);
  const currentPrincipal = Number(holding.value?.currentPrincipal);
  if (!Number.isFinite(currentValue) || !Number.isFinite(currentPrincipal)) return null;
  return currentValue - currentPrincipal;
});
const installmentSteps = computed(() => {
  const totalInstallments = Number(holding.value?.totalInstallments);
  const paidInstallments = Number(holding.value?.paidInstallments);
  if (!Number.isInteger(totalInstallments) || totalInstallments <= 0) return [];

  return Array.from({ length: totalInstallments }, (_, index) => ({
    number: index + 1,
    state:
      index < paidInstallments
        ? "paid"
        : index === paidInstallments
          ? "next"
          : "scheduled",
  }));
});

function getStepClasses(step) {
  if (step.state === "paid") return "bg-pink text-white";
  if (step.state === "next") return "bg-yellow text-ink";
  return "bg-surface text-muted";
}

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "보유 상품 정보를 불러오지 못했습니다.";
}

async function loadHolding() {
  isLoading.value = true;
  errorMessage.value = "";
  holding.value = null;

  try {
    holding.value = await fetchProductHolding(route.params.holdingProductId);
    if (!holding.value) errorMessage.value = "보유 상품을 찾을 수 없습니다.";
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

function handleViewTerminationEstimate() {
  router.push({
    name: "product-termination",
    params: { holdingProductId: route.params.holdingProductId },
  });
}

watch(() => route.params.holdingProductId, loadHolding, { immediate: true });
</script>

<template>
  <div class="flex flex-col gap-4">
    <header class="flex items-center gap-2">
      <BackButton />
      <h1 class="text-h1 text-ink">{{ pageTitle }}</h1>
    </header>

    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">상품 상세를 불러오는 중이에요</h2>
        <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">상품 상세를 확인할 수 없어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadHolding">다시 시도하기</BottomButton>
      </div>
    </BaseCard>

    <template v-else-if="holding">
      <BaseCard color="white" elevation="highlight">
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-soft text-h2 text-ink"
              >
                {{ holding.financialCompanyName?.charAt(0) || "금" }}
              </span>
              <div class="flex flex-col gap-2">
                <p class="text-caption text-muted">
                  {{ formatNullableText(holding.financialCompanyName) }}
                </p>
                <h2 class="text-h2 text-ink">
                  {{ formatNullableText(holding.productName) }}
                </h2>
                <p class="text-caption text-muted tabular-nums">
                  {{ productSummaryLabel }}
                </p>
              </div>
            </div>
            <BasePill :label="status.label" :color="status.color" />
          </div>

          <div class="flex flex-col gap-2 border-t border-line pt-4">
            <div class="flex items-center justify-between gap-4">
              <span class="text-caption text-muted">가입일</span>
              <span class="text-caption text-muted">만기일</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-surface">
              <div
                class="h-full rounded-full bg-pink"
                :style="{ width: `${progressRate}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between gap-4 text-caption text-ink tabular-nums">
              <span>{{ formatLocalDate(holding.startDate) }}</span>
              <span>{{ formatLocalDate(holding.maturityDate) }}</span>
            </div>
            <p class="text-caption text-muted">{{ remainingDaysLabel }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard v-if="isSaving" color="blue">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-h2 text-ink">납입 현황</h2>
            <strong class="text-h2 text-profit tabular-nums">
              {{ holding.paidInstallments ?? 0 }} / {{ holding.totalInstallments ?? "—" }}회
            </strong>
          </div>

          <div class="flex flex-wrap gap-2" aria-label="적금 납입 회차">
            <span
              v-for="step in installmentSteps"
              :key="step.number"
              :class="[
                getStepClasses(step),
                'flex h-6 w-6 items-center justify-center rounded-full text-caption font-semibold tabular-nums',
              ]"
            >
              {{ step.number }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-4 border-t border-line pt-4">
            <div class="flex flex-col gap-2">
              <span class="text-caption text-muted">다음 납입일</span>
              <strong class="text-body text-ink tabular-nums">
                {{ formatLocalDate(holding.nextPaymentDate) }}
              </strong>
            </div>
            <div class="flex flex-col gap-2 text-right">
              <span class="text-caption text-muted">납입 금액</span>
              <strong class="text-body text-blue tabular-nums">
                {{ formatCurrency(holding.joinAmount) }}
              </strong>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <p class="text-caption text-muted">평가금액</p>
            <p class="text-amount text-ink tabular-nums">
              {{ formatCurrency(holding.currentValue) }}
            </p>
          </div>
          <dl class="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div class="flex flex-col gap-2">
              <dt class="text-caption text-muted">현재 납입 원금</dt>
              <dd class="text-body text-ink tabular-nums">
                {{ formatCurrency(holding.currentPrincipal) }}
              </dd>
            </div>
            <div class="flex flex-col gap-2">
              <dt class="text-caption text-muted">평가손익</dt>
              <dd class="text-body text-success tabular-nums">
                {{ formatSignedCurrency(evaluationGain) }}
              </dd>
            </div>
          </dl>
        </div>
      </BaseCard>

      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-4">
            <span class="text-caption text-muted">상품 유형</span>
            <strong class="text-body text-ink">{{ productTypeLabel }}</strong>
          </div>
          <div v-if="isSaving" class="flex items-center justify-between gap-4">
            <span class="text-caption text-muted">적립 유형</span>
            <strong class="text-body text-ink">
              {{ formatNullableText(holding.reserveTypeName) }}
            </strong>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-caption text-muted">
              {{ isSaving ? "월 납입 금액" : "가입 금액" }}
            </span>
            <strong class="text-body text-ink tabular-nums">
              {{ formatCurrency(holding.joinAmount) }}
            </strong>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-caption text-muted">적용 금리</span>
            <strong class="text-body text-ink tabular-nums">
              {{ formatInterestRate(holding.appliedRate) }}
            </strong>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-caption text-muted">예상 만기금액</span>
            <strong class="text-body text-profit tabular-nums">
              {{ formatCurrency(holding.expectedMaturityAmount) }}
            </strong>
          </div>
        </div>
      </BaseCard>

      <BaseCard v-if="!isSaving" color="yellow">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-profit">아직 만기가 아니에요</h2>
          <p class="text-caption text-muted">
            {{ remainingDaysLabel }} 만기 전에 해지하면 예상 이자와 달라질 수 있어요.
          </p>
        </div>
      </BaseCard>

      <BottomButton color="white" @click="handleViewTerminationEstimate">
        해지 예상 조회
      </BottomButton>
    </template>
  </div>
</template>
