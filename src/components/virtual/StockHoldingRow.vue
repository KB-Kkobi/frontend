<script setup>
import { computed } from "vue";
import { formatCurrency, formatRate } from "@/utils/format";

const props = defineProps({
  holding: {
    type: Object,
    required: true,
  },
});

const valuationAmount = computed(() => {
  const { valuationAmount, currentPrice, quantity } = props.holding;
  if (valuationAmount !== null && valuationAmount !== undefined) return valuationAmount;
  if (currentPrice !== null && currentPrice !== undefined && quantity) {
    return currentPrice * quantity;
  }
  return null;
});

const profitRate = computed(() => {
  const { profitRate, currentPrice, averagePrice } = props.holding;
  if (profitRate !== null && profitRate !== undefined) return profitRate;
  if (currentPrice !== null && currentPrice !== undefined && averagePrice) {
    return ((currentPrice - averagePrice) / averagePrice) * 100;
  }
  return null;
});

const profitColorClass = computed(() => {
  if (profitRate.value === null) return "text-muted";
  if (profitRate.value > 0) return "text-profit";
  if (profitRate.value < 0) return "text-loss";
  return "text-muted";
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-body text-ink tracking-tight">{{ holding.name ?? holding.ticker }}</span>
    <div class="flex items-center justify-between gap-4">
      <span class="text-caption text-muted tabular-nums">
        평가금액 {{ valuationAmount !== null ? formatCurrency(valuationAmount) : "—" }}
      </span>
      <span :class="['text-caption font-semibold tabular-nums', profitColorClass]">
        {{ profitRate !== null ? formatRate(profitRate) : "—" }}
      </span>
    </div>
  </div>
</template>
