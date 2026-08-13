<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import {
  PRODUCT_TYPES,
  getProductHoldingStatus,
  getProductTypeLabel,
  normalizeProductType,
} from "@/constants/product";
import {
  formatCurrency,
  formatInterestRate,
  formatNullableText,
} from "@/utils/format";

const props = defineProps({
  holding: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["select"]);

const isSaving = computed(
  () => normalizeProductType(props.holding.productType) === PRODUCT_TYPES.SAVING,
);
const typeLabel = computed(() => getProductTypeLabel(props.holding.productType));
const status = computed(() => getProductHoldingStatus(props.holding.status));
const progressRate = computed(() => {
  const rate = Number(props.holding.maturityProgressRate);
  if (!Number.isFinite(rate)) return 0;
  return Math.min(100, Math.max(0, rate));
});

function handleSelect() {
  emit("select", props.holding);
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="`${holding.productName} 상세 보기`"
    @click="handleSelect"
    @keydown.enter.prevent="handleSelect"
    @keydown.space.prevent="handleSelect"
  >
    <BaseCard color="white" elevation="flat">
      <article class="flex flex-col gap-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <BasePill :label="typeLabel" color="pink" />
              <BasePill :label="status.label" :color="status.color" />
            </div>
            <p class="text-caption text-muted">
              {{ formatNullableText(holding.financialCompanyName) }}
            </p>
            <h2 class="text-h2 text-ink">
              {{ formatNullableText(holding.productName) }}
            </h2>
          </div>
          <p class="text-h2 text-profit tabular-nums">
            {{ formatInterestRate(holding.appliedRate) }}
          </p>
        </div>

        <div class="flex flex-col gap-2 border-t border-line pt-4">
          <div class="flex items-center justify-between gap-4">
            <span class="text-caption text-muted">만기 진행률</span>
            <strong class="text-caption font-semibold text-pink tabular-nums">
              {{ progressRate.toFixed(1) }}%
            </strong>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-surface">
            <div
              class="h-full rounded-full bg-pink"
              :style="{ width: `${progressRate}%` }"
            ></div>
          </div>
        </div>

        <dl class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <dt class="text-caption text-muted">현재 평가금액</dt>
            <dd class="text-body font-semibold text-ink tabular-nums">
              {{ formatCurrency(holding.currentValue) }}
            </dd>
          </div>
          <div class="flex flex-col gap-2">
            <dt class="text-caption text-muted">예상 만기금액</dt>
            <dd class="text-body font-semibold text-profit tabular-nums">
              {{ formatCurrency(holding.expectedMaturityAmount) }}
            </dd>
          </div>
          <div v-if="isSaving" class="flex flex-col gap-2">
            <dt class="text-caption text-muted">납입 횟수</dt>
            <dd class="text-body text-ink tabular-nums">
              {{ holding.paidInstallments ?? 0 }} / {{ holding.totalInstallments ?? "—" }}회
            </dd>
          </div>
          <div class="flex flex-col gap-2">
            <dt class="text-caption text-muted">상세 보기</dt>
            <dd class="text-body font-semibold text-pink">확인하기</dd>
          </div>
        </dl>
      </article>
    </BaseCard>
  </div>
</template>
