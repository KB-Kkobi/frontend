<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import { formatCurrency, formatRate } from "@/utils/format";
import { calcProfitRate } from "@/utils/evaluation";

const props = defineProps({
  quantity: { type: Number, required: true },
  avgPrice: { type: Number, required: true },
  currentPrice: { type: Number, default: null },
});

const profitRate = computed(() => calcProfitRate(props.currentPrice, props.avgPrice));

const profitColorClass = computed(() => {
  if (profitRate.value > 0) return "text-profit";
  if (profitRate.value < 0) return "text-loss";
  return "text-muted";
});
</script>

<template>
  <BaseCard>
    <div class="flex flex-col gap-4">
      <h2 class="text-h2 text-ink">내 보유 현황</h2>

      <div class="flex">
        <div class="flex flex-1 flex-col items-center gap-2">
          <span class="text-caption text-muted">보유 수량</span>
          <span class="text-h2 text-ink tabular-nums">{{ quantity }}주</span>
        </div>
        <div
          class="flex flex-1 flex-col items-center gap-2 border-l border-line"
        >
          <span class="text-caption text-muted">평균 단가</span>
          <span class="text-h2 text-ink tabular-nums">
            {{ formatCurrency(avgPrice) }}
          </span>
        </div>
        <div
          class="flex flex-1 flex-col items-center gap-2 border-l border-line"
        >
          <span class="text-caption text-muted">평가 수익률</span>
          <span :class="[profitColorClass, 'text-h2 tabular-nums']">
            {{ profitRate !== null ? formatRate(profitRate) : "-" }}
          </span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
