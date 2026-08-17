<script setup>
import { computed } from "vue";
import ProductBankLogo from "@/components/product/ProductBankLogo.vue";
import {
  formatBankName,
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

const dDayLabel = computed(() => {
  const remainingDays = Number(props.holding.remainingDays);
  if (!Number.isFinite(remainingDays)) return null;
  if (remainingDays <= 0) return "만기 도래";
  return `만기 D-${remainingDays}`;
});
</script>

<template>
  <div class="flex items-center gap-4">
    <ProductBankLogo :name="holding.financialCompanyName" />

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <span class="truncate text-caption text-muted">
        {{ formatBankName(holding.financialCompanyName) }}
      </span>
      <span class="break-words text-h2 text-ink tracking-tight">
        {{ formatNullableText(holding.productName) }}
      </span>
      <strong class="text-body font-semibold text-ink tabular-nums">
        {{ formatCurrency(holding.currentValue) }}
      </strong>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-caption text-muted tabular-nums">
          적용금리 {{ formatInterestRate(holding.appliedRate) }}
        </span>
        <span v-if="dDayLabel" class="text-caption text-muted tabular-nums">
          {{ dDayLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
