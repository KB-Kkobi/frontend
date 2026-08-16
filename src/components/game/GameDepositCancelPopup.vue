<script setup>
import { computed } from 'vue';
import BaseBadge from '@/components/common/BaseBadge.vue';
import BottomButton from '@/components/common/BottomButton.vue';
import {
  GAME_DEPOSIT_INTEREST_RATE,
  GAME_DEPOSIT_INTEREST_TAX_RATE,
  GAME_DEPOSIT_MONTHS,
} from '@/constants/game';
import { formatCurrency } from '@/utils/format';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  depositRatio: {
    type: Number,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'tutorial'].includes(v),
  },
  dismissible: {
    type: Boolean,
    default: true,
  },
  showBackdrop: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const maturityInterest = computed(() =>
  Math.round(
    props.depositAmount *
      (GAME_DEPOSIT_INTEREST_RATE / 100) *
      (GAME_DEPOSIT_MONTHS / 12) *
      (1 - GAME_DEPOSIT_INTEREST_TAX_RATE / 100),
  ),
);
const maturityAmount = computed(
  () => props.depositAmount + maturityInterest.value,
);

function closePopup() {
  if (!props.dismissible) return;
  emit('update:modelValue', false);
}

function confirmCancel() {
  if (props.isSubmitting) return;
  emit('confirm');
}
</script>

<template>
  <Teleport to="body">
    <template v-if="modelValue">
      <button
        v-if="showBackdrop"
        type="button"
        class="fixed inset-0 z-40 bg-ink/20"
        aria-label="예금 중도 해지 창 닫기"
        :disabled="!dismissible"
        @click="closePopup"
      ></button>

      <section
        data-tutorial-target="deposit-cancel-card"
        :class="[
          'fixed inset-x-5 top-1/2 z-50 mx-auto flex max-h-[90dvh] max-w-[390px] -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-3xl bg-white px-5 py-7',
          variant === 'tutorial' ? 'shadow-float' : 'shadow-popup',
        ]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-cancel-title"
      >
        <div class="flex justify-center">
          <span
            :class="[
              'rounded-full px-3 py-1 text-caption font-semibold',
              variant === 'tutorial'
                ? 'bg-segment text-muted'
                : 'bg-pink-soft text-error',
            ]"
          >
            중도 해지
          </span>
        </div>

        <div
          data-tutorial-target="deposit-not-matured"
          class="flex flex-col items-center gap-2 text-center"
        >
          <h2 id="deposit-cancel-title" class="text-amount text-navy">
            아직 만기가 아니에요
          </h2>
          <p class="text-body text-muted">
            지금 해지하면 약속한 연 {{ GAME_DEPOSIT_INTEREST_RATE.toFixed(2) }}%
            대신<br />
            중도해지 금리만 받으며, 본 서비스에서는 0%로 계산해요.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <div
            data-tutorial-target="deposit-maturity-amount"
            class="flex flex-col gap-3 rounded-2xl bg-pink-soft p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <strong class="text-h2 text-ink">
                {{ GAME_DEPOSIT_MONTHS }}개월 채우고 만기까지 가면
              </strong>
              <BaseBadge color="pink">
                연 {{ GAME_DEPOSIT_INTEREST_RATE.toFixed(2) }}%
              </BaseBadge>
            </div>
            <strong class="text-amount text-pink tabular-nums">
              {{ formatCurrency(maturityAmount) }}
            </strong>
            <span
              data-tutorial-target="deposit-principal"
              class="text-caption text-muted tabular-nums"
            >
              납입 {{ formatCurrency(depositAmount) }} + 이자
              {{ formatCurrency(maturityInterest) }}
            </span>
          </div>

          <div data-tutorial-target="deposit-cancel-amount" class="flex flex-col gap-3 rounded-2xl bg-base p-4">
            <div class="flex items-center justify-between gap-3">
              <strong class="text-h2 text-ink">지금 해지하면</strong>
              <span
                class="rounded-full bg-line px-3 py-1 text-caption text-muted"
              >
                연 0.00%
              </span>
            </div>
            <strong class="text-amount text-ink tabular-nums">
              {{ formatCurrency(depositAmount) }}
            </strong>
            <span class="text-caption text-muted"
              >원금만 수령 · 이자 미적용</span
            >
          </div>

          <div
            v-if="variant !== 'tutorial'"
            class="flex items-center justify-between gap-4 rounded-xl bg-error/10 p-3"
          >
            <span class="text-body font-semibold text-error"
              >못 받게 되는 이자</span
            >
            <strong class="text-h1 text-error tabular-nums">
              {{ formatCurrency(maturityInterest) }}
            </strong>
          </div>
        </div>

        <p
          v-if="variant === 'tutorial'"
          data-tutorial-target="deposit-warning-note"
          class="text-body text-muted"
        >
          해지하면 예·적금 비중이
          <strong class="text-h2 text-ink">
            {{ depositRatio.toFixed(0) }}% → 0% </strong
          >가 돼요.
          <strong class="text-ink"
            >한 번 해지하면 다시 가입하거나 되돌릴 수 없어요.</strong
          >
        </p>
        <p v-else class="text-body text-muted">
          해지하면 예금 비중이
          <strong class="text-h2 text-error">
            {{ depositRatio.toFixed(0) }}% → 0% </strong
          >가 되고, 안전자산이 줄어들어요.
          <strong class="text-ink"
            >한 번 해지하면 다시 가입하거나 되돌릴 수 없어요.</strong
          >
        </p>

        <p v-if="errorMessage" class="text-caption text-error" role="alert">
          {{ errorMessage }}
        </p>

        <div class="grid grid-cols-2 gap-3">
          <BottomButton
            data-tutorial-target="deposit-confirm"
            color="danger"
            :disabled="isSubmitting"
            @click="confirmCancel"
          >
            {{ isSubmitting ? '해지 처리 중...' : '해지하기' }}
          </BottomButton>
          <BottomButton
            color="pink"
            :disabled="isSubmitting || variant === 'tutorial'"
            @click="closePopup"
          >
            계속 납입하기
          </BottomButton>
        </div>
      </section>
    </template>
  </Teleport>
</template>
