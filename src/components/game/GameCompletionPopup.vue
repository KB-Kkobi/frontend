<script setup>
import { computed } from 'vue';
import BaseBadge from '@/components/common/BaseBadge.vue';
import BottomButton from '@/components/common/BottomButton.vue';
import { GAME_SEED_MONEY } from '@/constants/game';
import {
  formatCurrency,
  formatRate,
  formatSignedCurrency,
} from '@/utils/format';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  stockAmount: {
    type: Number,
    required: true,
  },
  cashAmount: {
    type: Number,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['retry', 'view-result']);

const totalAssetAmount = computed(
  () => props.stockAmount + props.cashAmount + props.depositAmount,
);
const totalProfitAmount = computed(
  () => totalAssetAmount.value - GAME_SEED_MONEY,
);
const totalProfitRate = computed(
  () => (totalProfitAmount.value / GAME_SEED_MONEY) * 100,
);
const calculateAssetRatio = (assetAmount) => {
  if (totalAssetAmount.value === 0) return 0;
  return (assetAmount / totalAssetAmount.value) * 100;
};
const cashRatio = computed(() => calculateAssetRatio(props.cashAmount));
const depositRatio = computed(() => calculateAssetRatio(props.depositAmount));
const stockRatio = computed(() => calculateAssetRatio(props.stockAmount));
const profitColorClass = computed(() => {
  if (totalProfitAmount.value > 0) return 'text-profit';
  if (totalProfitAmount.value < 0) return 'text-loss';
  return 'text-muted';
});
</script>

<template>
  <Teleport to="body">
    <template v-if="modelValue">
      <div class="fixed inset-0 z-40 bg-ink/20" aria-hidden="true"></div>

      <section
        class="fixed inset-x-5 top-1/2 z-50 mx-auto flex max-h-[90dvh] max-w-[390px] -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-3xl bg-white px-5 py-7 shadow-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-completion-title"
      >
        <div class="flex justify-center">
          <BaseBadge color="pink">투자 게임 완료</BaseBadge>
        </div>

        <div class="flex flex-col items-center gap-2 text-center">
          <h2 id="game-completion-title" class="text-amount text-navy">
            12개월간의 투자가 끝났어요
          </h2>
          <p class="text-body text-muted">
            게임에서 선택한 투자 행동을 바탕으로 성향을 분석했어요.
          </p>
        </div>

        <div
          class="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5"
        >
          <span class="text-body text-muted">최종 총자산</span>
          <strong class="text-amount text-navy tabular-nums">
            {{ formatCurrency(totalAssetAmount) }}
          </strong>
          <div
            class="flex items-start justify-between gap-4 border-t border-line pt-3"
          >
            <span class="text-caption text-muted">시작 자산 대비</span>
            <strong
              :class="[
                profitColorClass,
                'flex shrink-0 flex-col items-end gap-1 text-h1 tabular-nums',
              ]"
            >
              <span>{{ formatSignedCurrency(totalProfitAmount) }}</span>
              <span class="text-caption"
                >({{ formatRate(totalProfitRate) }})</span
              >
            </strong>
          </div>
        </div>

        <div class="flex flex-col gap-3 rounded-2xl bg-base p-4">
          <div
            class="flex h-2 w-full overflow-hidden rounded-full bg-surface"
            aria-label="최종 자산 비율"
          >
            <span class="bg-yellow" :style="{ width: `${cashRatio}%` }"></span>
            <span
              class="bg-green"
              :style="{ width: `${depositRatio}%` }"
            ></span>
            <span class="bg-pink" :style="{ width: `${stockRatio}%` }"></span>
          </div>

          <div class="flex justify-between gap-2 text-caption text-muted">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-yellow"></span>
              현금 {{ cashRatio.toFixed(0) }}%
            </span>
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-green"></span>
              예금 {{ depositRatio.toFixed(0) }}%
            </span>
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-pink"></span>
              주식 {{ stockRatio.toFixed(0) }}%
            </span>
          </div>

          <div class="border-t border-line"></div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-body text-muted">주식</span>
            <strong class="text-h2 text-ink tabular-nums">
              {{ formatCurrency(stockAmount) }}
            </strong>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-body text-muted">현금</span>
            <strong class="text-h2 text-ink tabular-nums">
              {{ formatCurrency(cashAmount) }}
            </strong>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-body text-muted">예금</span>
            <strong class="text-h2 text-ink tabular-nums">
              {{ formatCurrency(depositAmount) }}
            </strong>
          </div>
        </div>

        <p class="text-body text-muted">
          성향 진단 리포트에서 나의 투자 성향과 추천 자산 배분을 확인해 보세요.
        </p>

        <p v-if="errorMessage" class="text-caption text-error" role="alert">
          {{ errorMessage }}
        </p>

        <BottomButton
          color="pink"
          :disabled="isLoading"
          @click="errorMessage ? emit('retry') : emit('view-result')"
        >
          {{
            isLoading
              ? '성향 분석 중...'
              : errorMessage
                ? '다시 시도하기'
                : '내 성향 결과 확인하기'
          }}
        </BottomButton>
      </section>
    </template>
  </Teleport>
</template>
