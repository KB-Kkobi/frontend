<script setup>
import { ref, computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
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

const PERIOD_OPTIONS = [
  { key: "day", label: "일" },
  { key: "week", label: "주" },
  { key: "month", label: "월" },
];

const activePeriod = ref("day");

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
          {{ market }} · {{ code }}
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

      <!-- 차트 자리표시자 (추후 실제 차트로 교체) -->
      <div
        class="flex h-40 items-center justify-center rounded-2xl bg-surface"
      >
        <slot name="chart">
          <p class="text-caption text-muted">차트 영역</p>
        </slot>
      </div>

      <!-- 기간 선택 (내부 state만, 아직 동작 없음) -->
      <div class="flex justify-end gap-2">
        <button
          v-for="opt in PERIOD_OPTIONS"
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
