<script setup>
import { computed } from 'vue';
import BottomButton from '@/components/common/BottomButton.vue';
import {
  formatCurrency,
  formatRate,
  formatSignedCurrency,
} from '@/utils/format';
import {
  calcEvaluationAmount,
  calcProfitLoss,
  calcProfitRate,
} from '@/utils/evaluation';

const emit = defineEmits(['buy']);

const props = defineProps({
  stockQuantity: {
    type: Number,
    required: true,
  },
  averageStockPrice: {
    type: Number,
    required: true,
  },
  currentStockPrice: {
    type: Number,
    default: null,
  },
  cashAmount: {
    type: Number,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  depositStatus: {
    type: String,
    required: true,
  },
  remainingDepositDays: {
    type: Number,
    required: true,
  },
});

const stockEvaluationAmount = computed(() =>
  calcEvaluationAmount(props.currentStockPrice, props.stockQuantity),
);
const stockProfitAmount = computed(() =>
  calcProfitLoss(
    props.currentStockPrice,
    props.averageStockPrice,
    props.stockQuantity,
  ),
);
const stockProfitRate = computed(() => {
  if (props.stockQuantity === 0) return null;
  return calcProfitRate(props.currentStockPrice, props.averageStockPrice);
});
const totalAssetAmount = computed(
  () =>
    props.cashAmount + props.depositAmount + (stockEvaluationAmount.value ?? 0),
);

function calculateAssetRatio(amount) {
  if (totalAssetAmount.value === 0) return 0;
  return (amount / totalAssetAmount.value) * 100;
}

const stockRatio = computed(() =>
  calculateAssetRatio(stockEvaluationAmount.value ?? 0),
);
const cashRatio = computed(() => calculateAssetRatio(props.cashAmount));
const depositRatio = computed(() => calculateAssetRatio(props.depositAmount));
const profitColorClass = computed(() => {
  if (stockProfitAmount.value > 0) return 'text-profit';
  if (stockProfitAmount.value < 0) return 'text-loss';
  return 'text-muted';
});
const depositStatusText = computed(() => {
  if (props.depositStatus === 'CANCELLED') return '해지 완료';
  if (props.depositStatus === 'MATURED') return '만기 완료';
  if (props.depositStatus === 'NONE') return '미가입';
  return `만기 D-${props.remainingDepositDays}`;
});
</script>

<template>
  <section class="flex flex-col gap-6 py-2" aria-labelledby="portfolio-title">
    <h2 id="portfolio-title" class="sr-only">현재 자산 현황</h2>

    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex items-baseline gap-2">
          <strong class="text-h1 text-ink">종목 A</strong>
          <span class="text-body text-muted tabular-nums">
            {{ stockRatio.toFixed(0) }}%
          </span>
        </div>
        <p class="text-caption text-muted tabular-nums">
          평균 {{ formatCurrency(averageStockPrice) }} ·
          {{ stockQuantity.toLocaleString('ko-KR') }}주
        </p>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-1">
        <strong class="text-h1 text-ink tabular-nums">
          {{ formatCurrency(stockEvaluationAmount) }}
        </strong>
        <p
          :class="[profitColorClass, 'text-caption font-semibold tabular-nums']"
        >
          {{ formatSignedCurrency(stockProfitAmount) }}
          <span>
            ({{ stockProfitRate === null ? '—' : formatRate(stockProfitRate) }})
          </span>
        </p>
      </div>
    </div>

    <div
      class="flex items-center justify-between gap-4 border-t border-line pt-6"
    >
      <div class="flex items-baseline gap-2">
        <strong class="text-h1 text-ink">현금</strong>
        <span class="text-body text-muted tabular-nums">
          {{ cashRatio.toFixed(0) }}%
        </span>
      </div>
      <strong class="text-h1 text-ink tabular-nums">
        {{ formatCurrency(cashAmount) }}
      </strong>
    </div>

    <div
      class="flex items-start justify-between gap-4 border-t border-line pt-6"
    >
      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex items-baseline gap-2">
          <strong class="text-h1 text-ink">예금</strong>
          <span class="text-body text-muted tabular-nums">
            {{ depositRatio.toFixed(0) }}%
          </span>
        </div>
        <p class="text-caption text-muted">{{ depositStatusText }}</p>
      </div>
      <strong class="text-h1 text-ink tabular-nums">
        {{ formatCurrency(depositAmount) }}
      </strong>
    </div>

    <div class="grid grid-cols-2 gap-3 pt-2">
      <BottomButton color="pink" :disabled="cashAmount === 0" @click="emit('buy')"
        >매수</BottomButton
      >
      <BottomButton color="blue" :disabled="stockQuantity === 0"
        >매도</BottomButton
      >
    </div>
    <BottomButton
      color="white"
      :disabled="depositStatus !== 'ACTIVE' || depositAmount === 0"
    >
      예금 해지하기
    </BottomButton>
  </section>
</template>
