<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BottomButton from '@/components/common/BottomButton.vue';
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
  currentPrice: {
    type: Number,
    default: 0,
  },
  averagePrice: {
    type: Number,
    default: 0,
  },
  availableQuantity: {
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
  dismissible: {
    type: Boolean,
    default: true,
  },
  // 튜토리얼이 시트 위에 안내 카드를 띄울 공간이 부족할 때만 그만큼 위로 들어올린다.
  // 평상시(튜토리얼 밖)에는 0이라 기존 위치 그대로다.
  liftPx: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const quantity = ref(1);
const saleAmount = computed(() => props.currentPrice * quantity.value);
const realizedProfitAmount = computed(
  () => (props.currentPrice - props.averagePrice) * quantity.value,
);
const realizedProfitRate = computed(() => {
  if (props.averagePrice <= 0) return null;
  return ((props.currentPrice - props.averagePrice) / props.averagePrice) * 100;
});
const quantityInputWidth = computed(
  () => `${Math.max(String(quantity.value).length, 1)}ch`,
);
const isQuantityExceeded = computed(
  () => quantity.value > props.availableQuantity,
);
const canSubmit = computed(
  () =>
    props.currentPrice > 0 && quantity.value >= 1 && !isQuantityExceeded.value,
);
const profitColorClass = computed(() => {
  if (realizedProfitAmount.value > 0) return 'text-profit';
  if (realizedProfitAmount.value < 0) return 'text-loss';
  return 'text-muted';
});

function closeSheet() {
  if (!props.dismissible) return;
  quantity.value = 1;
  emit('update:modelValue', false);
}

function decreaseQuantity() {
  quantity.value = Math.max(1, Number(quantity.value || 1) - 1);
}

function increaseQuantity() {
  quantity.value = Math.min(
    props.availableQuantity,
    Number(quantity.value || 0) + 1,
  );
}

function setMinimumQuantity() {
  quantity.value = 1;
}

function setMaximumQuantity() {
  if (props.availableQuantity > 0) quantity.value = props.availableQuantity;
}

function updateQuantity(event) {
  if (event.target.value === '') {
    quantity.value = '';
    return;
  }

  const nextQuantity = Number(event.target.value);
  if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
    quantity.value = 1;
    event.target.value = '1';
    return;
  }
  const limitedQuantity = Math.min(nextQuantity, props.availableQuantity);
  quantity.value = limitedQuantity;
  event.target.value = String(limitedQuantity);
}

function restoreMinimumQuantity() {
  if (quantity.value === '') quantity.value = 1;
}

function submitOrder() {
  if (!canSubmit.value || props.isSubmitting) return;
  emit('submit', {
    quantity: quantity.value,
    saleAmount: saleAmount.value,
  });
}

function handleKeydown(event) {
  if (props.modelValue && event.key === 'Escape') closeSheet();
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) quantity.value = 1;
  },
);

onMounted(() => window.addEventListener('keydown', handleKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <Teleport to="body">
    <template v-if="modelValue">
      <button
        type="button"
        class="fixed inset-0 z-40 bg-transparent"
        aria-label="매도 창 닫기"
        :disabled="!dismissible"
        @click="closeSheet"
      ></button>

      <section
        data-tutorial-target="sell-order-card"
        class="fixed inset-x-0 z-50 mx-auto flex max-h-[85dvh] max-w-[430px] flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white px-5 pb-5 pt-3 shadow-popup"
        :style="{ bottom: `${liftPx}px` }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-sell-title"
      >
        <button
          type="button"
          class="mx-auto h-1.5 w-12 rounded-full bg-line"
          aria-label="매도 창 닫기"
          :disabled="!dismissible"
          @click="closeSheet"
        ></button>

        <h2 id="game-sell-title" class="text-amount text-navy">종목 A 매도</h2>

        <div data-tutorial-target="sell-price" class="flex items-center justify-between gap-4">
          <span class="text-h2 text-muted">매도 가격</span>
          <div class="flex items-baseline gap-2">
            <strong class="text-h1 text-ink tabular-nums">
              {{ formatCurrency(currentPrice) }}
            </strong>
            <span class="text-caption text-muted">오늘 시세</span>
          </div>
        </div>

        <div data-tutorial-target="sell-quantity" class="flex gap-3">
          <label class="sr-only" for="game-sell-quantity">매도 수량</label>
          <div
            class="flex h-12 min-w-0 flex-1 items-center gap-1 rounded-2xl border border-line bg-white px-5"
          >
            <input
              id="game-sell-quantity"
              :value="quantity"
              class="game-sell-quantity bg-transparent text-left text-h1 text-ink outline-none tabular-nums"
              :style="{ width: quantityInputWidth }"
              type="number"
              inputmode="numeric"
              min="1"
              :max="availableQuantity"
              aria-label="매도 수량"
              @input="updateQuantity"
              @blur="restoreMinimumQuantity"
            />
            <span class="text-h1 text-ink">주</span>
          </div>
          <button
            type="button"
            class="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white text-amount text-ink disabled:opacity-50"
            :disabled="quantity <= 1"
            aria-label="수량 줄이기"
            @click="decreaseQuantity"
          >
            −
          </button>
          <button
            type="button"
            class="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white text-amount text-ink"
            :disabled="quantity >= availableQuantity"
            aria-label="수량 늘리기"
            @click="increaseQuantity"
          >
            +
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="rounded-xl border border-line bg-white px-3 py-2 text-body text-ink"
            @click="setMinimumQuantity"
          >
            최소 1주
          </button>
          <button
            type="button"
            class="rounded-xl border border-line bg-white px-3 py-2 text-body text-ink disabled:opacity-50"
            :disabled="availableQuantity < 1"
            @click="setMaximumQuantity"
          >
            최대 {{ availableQuantity.toLocaleString('ko-KR') }}주
          </button>
        </div>

        <div class="flex flex-col gap-2 border-t border-line pt-4">
          <div
            data-tutorial-target="sell-amount"
            class="flex items-center justify-between gap-4"
          >
            <span class="text-h2 text-muted">총 매도 금액</span>
            <strong class="text-amount text-ink tabular-nums">
              {{ formatCurrency(saleAmount) }}
            </strong>
          </div>
          <div class="flex items-start justify-between gap-4">
            <span class="text-h2 text-muted">실현 손익</span>
            <div class="flex flex-col items-end gap-1">
              <strong
                :class="[
                  profitColorClass,
                  'text-h1 font-semibold tabular-nums',
                ]"
              >
                {{ formatSignedCurrency(Math.round(realizedProfitAmount)) }}
                <span>
                  ({{
                    realizedProfitRate === null
                      ? '—'
                      : formatRate(realizedProfitRate)
                  }})
                </span>
              </strong>
              <span class="text-caption text-muted tabular-nums">
                보유 수량 {{ availableQuantity.toLocaleString('ko-KR') }}주
              </span>
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="text-caption text-error" role="alert">
          {{ errorMessage }}
        </p>

        <BottomButton
          data-tutorial-target="sell-submit"
          color="blue"
          :disabled="!canSubmit || isSubmitting"
          @click="submitOrder"
        >
          {{
            isQuantityExceeded
              ? '보유 수량을 초과했습니다'
              : isSubmitting
                ? '매도 처리 중...'
                : '매도하기'
          }}
        </BottomButton>
      </section>
    </template>
  </Teleport>
</template>

<style scoped>
.game-sell-quantity {
  appearance: textfield;
}

.game-sell-quantity::-webkit-inner-spin-button,
.game-sell-quantity::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}
</style>
