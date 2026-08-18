<script setup>
import { computed } from 'vue';
import BottomButton from '@/components/common/BottomButton.vue';
import { GAME_SEED_MONEY } from '@/constants/game';
import {
  formatCurrency,
  formatRate,
  formatSignedCurrency,
} from '@/utils/format';
import { calcEvaluationAmount } from '@/utils/evaluation';

const emit = defineEmits(['buy', 'sell', 'cancel-deposit']);

const props = defineProps({
  stockQuantity: {
    type: Number,
    required: true,
  },
  averageStockPrice: {
    type: Number,
    required: true,
  },
  stockPrincipal: {
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
  isTradingDisabled: {
    type: Boolean,
    default: false,
  },
  buyDisabled: {
    type: Boolean,
    default: false,
  },
  sellDisabled: {
    type: Boolean,
    default: false,
  },
  cancelDepositDisabled: {
    type: Boolean,
    default: false,
  },
  highlightedAsset: {
    type: String,
    default: null,
    validator: (v) => v === null || ["stock", "cash", "deposit"].includes(v),
  },
});

const stockEvaluationAmount = computed(() =>
  calcEvaluationAmount(props.currentStockPrice, props.stockQuantity),
);
const stockProfitAmount = computed(() => {
  if (props.stockQuantity === 0 || stockEvaluationAmount.value === null) {
    return null;
  }
  return stockEvaluationAmount.value - props.stockPrincipal;
});
const stockProfitRate = computed(() => {
  if (stockProfitAmount.value === null || props.stockPrincipal <= 0)
    return null;
  return (stockProfitAmount.value / props.stockPrincipal) * 100;
});
const totalAssetAmount = computed(
  () =>
    props.cashAmount + props.depositAmount + (stockEvaluationAmount.value ?? 0),
);
const totalProfitAmount = computed(
  () => totalAssetAmount.value - GAME_SEED_MONEY,
);
const totalProfitRate = computed(
  () => (totalProfitAmount.value / GAME_SEED_MONEY) * 100,
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
const totalProfitColorClass = computed(() => {
  if (totalProfitAmount.value > 0) return 'text-profit';
  if (totalProfitAmount.value < 0) return 'text-loss';
  return 'text-muted';
});
function assetRowClass(asset) {
  return [
    'transition-colors duration-500 rounded-2xl',
    props.highlightedAsset === asset ? 'bg-pink-soft' : '',
  ];
}

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

    <div
      data-tutorial-target="total-asset"
      class="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4"
    >
      <div class="flex items-center justify-between gap-4">
        <strong class="text-h2 text-ink">현재 총자산</strong>
        <strong class="text-amount text-navy tabular-nums">
          {{ formatCurrency(totalAssetAmount) }}
        </strong>
      </div>
      <div class="flex items-center justify-between gap-4">
        <span class="text-caption text-muted">시작 자산</span>
        <span class="text-body text-muted tabular-nums">
          {{ formatCurrency(GAME_SEED_MONEY) }}
        </span>
      </div>
      <div
        class="flex items-center justify-between gap-4 border-t border-line pt-2"
      >
        <span class="text-caption text-muted">전체 손익</span>
        <span
          :class="[
            totalProfitColorClass,
            'text-body font-semibold tabular-nums',
          ]"
        >
          {{ formatSignedCurrency(totalProfitAmount) }}
          ({{ formatRate(totalProfitRate) }})
        </span>
      </div>
    </div>

    <div
      data-tutorial-target="holding-stock"
      :class="['flex items-start justify-between gap-4', assetRowClass('stock')]"
    >
      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex items-baseline gap-2">
          <strong class="text-h1 text-ink">종목 A</strong>
          <span class="text-body text-muted tabular-nums">
            {{ stockRatio.toFixed(0) }}%
          </span>
        </div>
        <p class="text-caption text-muted tabular-nums">
          평균 {{ formatCurrency(Math.round(averageStockPrice)) }} ·
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

    <div class="border-t border-line pt-6">
      <div
        data-tutorial-target="cash"
        :class="['flex items-center justify-between gap-4', assetRowClass('cash')]"
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
    </div>

    <div class="border-t border-line pt-6">
      <div
        data-tutorial-target="deposit"
        :class="['flex items-start justify-between gap-4', assetRowClass('deposit')]"
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
    </div>

    <div class="flex flex-col gap-2">
      <slot name="message" />

      <div class="grid grid-cols-2 gap-3">
        <BottomButton
          data-tutorial-target="buy-button"
          color="pink"
          :disabled="
            buyDisabled ||
            isTradingDisabled ||
            cashAmount === 0 ||
            !currentStockPrice ||
            cashAmount < currentStockPrice
          "
          @click="emit('buy')"
          >매수</BottomButton
        >
        <BottomButton
          data-tutorial-target="sell-button"
          color="blue"
          :disabled="sellDisabled || isTradingDisabled || stockQuantity === 0"
          @click="emit('sell')"
          >매도</BottomButton
        >
      </div>
      <BottomButton
        data-tutorial-target="cancel-deposit-button"
        color="white"
        :disabled="
          cancelDepositDisabled || depositStatus !== 'ACTIVE' || depositAmount === 0
        "
        @click="emit('cancel-deposit')"
      >
        예금 해지하기
      </BottomButton>
    </div>
  </section>
</template>
