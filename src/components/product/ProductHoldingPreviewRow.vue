<script setup>
import { computed } from "vue";
import { formatCurrency, formatInterestRate, formatNullableText } from "@/utils/format";

const props = defineProps({
  holding: {
    type: Object,
    required: true,
  },
});

const dDayLabel = computed(() => {
  const remainingDays = Number(props.holding.remainingDays);
  if (!Number.isFinite(remainingDays)) return null;
  if (remainingDays <= 0) return "만기 도래";
  return `만기 D-${remainingDays}`;
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <span class="text-body text-ink tracking-tight">{{ formatNullableText(holding.productName) }}</span>
      <span v-if="dDayLabel" class="text-caption font-semibold text-pink tabular-nums">{{ dDayLabel }}</span>
    </div>
    <div class="flex items-center justify-between gap-4">
      <span class="text-caption text-muted tabular-nums">평가금액 {{ formatCurrency(holding.currentValue) }}</span>
      <span class="text-caption text-muted tabular-nums">적용금리 {{ formatInterestRate(holding.appliedRate) }}</span>
    </div>
  </div>
</template>
