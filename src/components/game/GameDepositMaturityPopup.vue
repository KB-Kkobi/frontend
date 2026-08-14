<script setup>
import { computed } from 'vue';
import BaseBadge from '@/components/common/BaseBadge.vue';
import BottomButton from '@/components/common/BottomButton.vue';
import {
  GAME_DEPOSIT_INTEREST_RATE,
  GAME_DEPOSIT_INTEREST_TAX_RATE,
  GAME_DEPOSIT_MONTHS,
} from '@/constants/game';
import { formatCurrency, formatSignedCurrency } from '@/utils/format';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['confirm']);

const grossInterest = computed(
  () =>
    props.depositAmount *
    (GAME_DEPOSIT_INTEREST_RATE / 100) *
    (GAME_DEPOSIT_MONTHS / 12),
);
const afterTaxInterest = computed(() =>
  Math.round(grossInterest.value * (1 - GAME_DEPOSIT_INTEREST_TAX_RATE / 100)),
);
const maturityAmount = computed(
  () => props.depositAmount + afterTaxInterest.value,
);

function confirmMaturity() {
  emit('confirm', maturityAmount.value);
}
</script>

<template>
  <Teleport to="body">
    <template v-if="modelValue">
      <div class="fixed inset-0 z-40 bg-ink/20" aria-hidden="true"></div>

      <section
        class="fixed inset-x-5 top-1/2 z-50 mx-auto flex max-h-[90dvh] max-w-[390px] -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-3xl bg-white px-5 py-7 shadow-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-maturity-title"
      >
        <div class="flex justify-center">
          <BaseBadge color="green">예금 만기</BaseBadge>
        </div>

        <div class="flex flex-col items-center gap-2 text-center">
          <h2 id="deposit-maturity-title" class="text-amount text-navy">
            {{ GAME_DEPOSIT_MONTHS }}개월 예금이 <br />만기가 되었어요
          </h2>
          <p class="text-body text-muted">
            약속한 연 {{ GAME_DEPOSIT_INTEREST_RATE.toFixed(2) }}% 금리를 모두
            받았어요. <br />
            만기 수령액을 확인해 보세요.
          </p>
        </div>

        <div class="flex flex-col gap-4 rounded-2xl bg-green-soft p-5">
          <div class="flex items-center justify-between gap-4">
            <span class="text-body text-muted">납입 원금</span>
            <strong class="text-h1 text-ink tabular-nums">
              {{ formatCurrency(depositAmount) }}
            </strong>
          </div>
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-body text-muted">세후 이자</span>
              <span class="text-caption text-muted">
                약속된 연 {{ GAME_DEPOSIT_INTEREST_RATE.toFixed(2) }}% 반영
              </span>
            </div>
            <strong class="text-h1 text-green tabular-nums">
              {{ formatSignedCurrency(afterTaxInterest) }}
            </strong>
          </div>
          <div class="border-t border-line"></div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-h2 text-ink">만기 수령액 합계</span>
            <strong class="text-amount text-ink tabular-nums">
              {{ formatCurrency(maturityAmount) }}
            </strong>
          </div>
        </div>

        <BottomButton color="green" @click="confirmMaturity">
          확인
        </BottomButton>
      </section>
    </template>
  </Teleport>
</template>
