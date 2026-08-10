<script setup>
import { ref, computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import PriceChart from "@/components/security/PriceChart.vue";
import { CHART_PERIODS } from "@/constants/chart";
import {
  formatCurrency,
  formatSignedCurrency,
  formatRate,
} from "@/utils/format";

const props = defineProps({
  code: { type: String, default: "005930" },
  name: { type: String, default: "삼성전자" },
  market: { type: String, default: "KOSPI" },
  price: { type: Number, default: 75300 },
  change: { type: Number, default: 300 },
  changeRate: { type: Number, default: 0.4 },
});

const activePeriod = ref(CHART_PERIODS[0].key);

const changeColorClass = computed(() => {
  if (props.change > 0) return "text-profit";
  if (props.change < 0) return "text-loss";
  return "text-muted";
});

function handlePeriodSelect(key) {
  activePeriod.value = key;
}
</script>

<template>
  <BaseCard>
    <div class="flex flex-col gap-4">
      <!-- 헤더: 종목명 · 시장 · 코드 -->
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">{{ name }}</h2>
        <span class="text-caption text-muted tabular-nums">
          <template v-if="market">{{ market }} · </template>{{ code }}
        </span>
      </div>

      <!-- 현재가 · 등락 -->
      <div class="flex flex-col gap-2">
        <p class="text-amount text-ink tabular-nums">
          {{ formatCurrency(price) }}
        </p>
        <p :class="[changeColorClass, 'text-body font-semibold tabular-nums']">
          {{ formatSignedCurrency(change) }} ({{ formatRate(changeRate) }})
        </p>
      </div>

      <!-- 캔들스틱 차트 -->
      <PriceChart :code="code" :period="activePeriod" />

      <!-- 기간 선택 -->
      <div class="flex justify-end gap-2">
        <button
          v-for="opt in CHART_PERIODS"
          :key="opt.key"
          type="button"
          :class="[
            'py-3 px-4 text-caption',
            opt.key === activePeriod
              ? 'text-pink font-semibold'
              : 'text-muted',
          ]"
          @click="handlePeriodSelect(opt.key)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </BaseCard>
</template>
