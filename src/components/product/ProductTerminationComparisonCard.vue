<script setup>
import BaseCard from "@/components/common/BaseCard.vue";
import { formatCurrency, formatInterestRate } from "@/utils/format";

defineProps({
  estimate: {
    type: Object,
    required: true,
  },
  isSaving: Boolean,
});
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">얼마나 차이 날까요?</h2>
        <p class="text-caption text-muted">
          만기 유지와 오늘 해지할 때의 세후 예상 금액을 비교했어요.
        </p>
      </div>

      <BaseCard v-if="isSaving" color="white" elevation="flat">
        <div class="flex items-center justify-between gap-4">
          <span class="text-caption text-muted">앞으로 남은 납입</span>
          <strong class="text-body font-semibold text-pink tabular-nums">
            {{ estimate.remainingInstallments ?? 0 }}회 ·
            {{ formatCurrency(estimate.remainingContributionAmount) }}
          </strong>
        </div>
      </BaseCard>

      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-4 rounded-2xl border border-pink bg-pink-soft p-4">
          <div class="flex flex-col gap-2">
            <span class="text-caption text-profit">만기까지 유지</span>
            <span class="text-caption text-muted tabular-nums">
              연 {{ formatInterestRate(estimate.appliedRate) }}
            </span>
          </div>
          <strong class="text-h1 text-profit tabular-nums">
            {{ formatCurrency(estimate.expectedMaturityAmount) }}
          </strong>
          <div class="flex flex-col gap-2 text-caption text-muted tabular-nums">
            <span>원금 {{ formatCurrency(estimate.expectedMaturityPrincipal) }}</span>
            <span>세후 이자 {{ formatCurrency(estimate.expectedMaturityAfterTaxInterest) }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">오늘 해지</span>
            <span class="text-caption text-muted tabular-nums">
              현재까지 발생 이자 기준
            </span>
          </div>
          <strong class="text-h1 text-ink tabular-nums">
            {{ formatCurrency(estimate.terminationRefundAmount) }}
          </strong>
          <div class="flex flex-col gap-2 text-caption text-muted tabular-nums">
            <span>반환 원금 {{ formatCurrency(estimate.currentPrincipal) }}</span>
            <span>세후 이자 {{ formatCurrency(estimate.terminationAfterTaxInterest) }}</span>
          </div>
        </div>
      </div>

      <BaseCard color="white" elevation="flat">
        <div class="flex items-center justify-between gap-4">
          <span class="text-body text-pink">포기하게 되는 이자</span>
          <strong class="text-h2 text-pink tabular-nums">
            {{ formatCurrency(estimate.foregoneInterest) }}
          </strong>
        </div>
      </BaseCard>
    </div>
  </BaseCard>
</template>
