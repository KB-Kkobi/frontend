<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BottomButton from '@/components/common/BottomButton.vue';
import { formatCurrency } from '@/utils/format';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  currentPrice: {
    type: Number,
    default: 0,
  },
  availableAmount: {
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
const maximumQuantity = computed(() => {
  if (props.currentPrice <= 0) return 0;
  return Math.floor(props.availableAmount / props.currentPrice);
});
const orderAmount = computed(() => props.currentPrice * quantity.value);
const quantityInputWidth = computed(
  () => `${Math.max(String(quantity.value).length, 1)}ch`,
);
const isOrderExceeded = computed(
  () => orderAmount.value > props.availableAmount,
);
const canSubmit = computed(
  () => props.currentPrice > 0 && quantity.value >= 1 && !isOrderExceeded.value,
);

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
    maximumQuantity.value,
    Number(quantity.value || 0) + 1,
  );
}

function setMinimumQuantity() {
  quantity.value = 1;
}

function setMaximumQuantity() {
  if (maximumQuantity.value > 0) quantity.value = maximumQuantity.value;
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
  const limitedQuantity = Math.min(nextQuantity, maximumQuantity.value);
  quantity.value = limitedQuantity;
  event.target.value = String(limitedQuantity);
}

function restoreMinimumQuantity() {
  if (quantity.value === '') quantity.value = 1;
}

function handleKeydown(event) {
  if (props.modelValue && event.key === 'Escape') closeSheet();
}

function submitOrder() {
  if (!canSubmit.value || props.isSubmitting) return;

  emit('submit', {
    quantity: quantity.value,
    orderAmount: orderAmount.value,
  });
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
        aria-label="매수 창 닫기"
        :disabled="!dismissible"
        @click="closeSheet"
      ></button>

      <section
        data-tutorial-target="buy-order-card"
        class="fixed inset-x-0 z-50 mx-auto flex max-h-[85dvh] max-w-[430px] flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white px-5 pb-5 pt-3 shadow-popup"
        :style="{ bottom: `${liftPx}px` }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-buy-title"
      >
        <button
          type="button"
          class="mx-auto h-1.5 w-12 rounded-full bg-line"
          aria-label="매수 창 닫기"
          :disabled="!dismissible"
          @click="closeSheet"
        ></button>

        <h2 id="game-buy-title" class="text-amount text-navy">종목 A 매수</h2>

        <div data-tutorial-target="buy-price" class="flex items-center justify-between gap-4">
          <span class="text-h2 text-muted">구매 가격</span>
          <div class="flex items-baseline gap-2">
            <strong class="text-h1 text-ink tabular-nums">
              {{ formatCurrency(currentPrice) }}
            </strong>
            <span class="text-caption text-muted">오늘 시세</span>
          </div>
        </div>

        <div data-tutorial-target="buy-quantity" class="flex gap-3">
          <label class="sr-only" for="game-buy-quantity">매수 수량</label>
          <div
            class="flex h-12 min-w-0 flex-1 items-center gap-1 rounded-2xl border border-line bg-white px-5"
          >
            <input
              id="game-buy-quantity"
              :value="quantity"
              class="game-buy-quantity bg-transparent text-left text-h1 text-ink outline-none tabular-nums"
              :style="{ width: quantityInputWidth }"
              type="number"
              inputmode="numeric"
              min="1"
              :max="maximumQuantity"
              aria-label="매수 수량"
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
            :disabled="quantity >= maximumQuantity"
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
            :disabled="maximumQuantity < 1"
            @click="setMaximumQuantity"
          >
            최대 {{ maximumQuantity.toLocaleString('ko-KR') }}주
          </button>
        </div>

        <div class="flex flex-col gap-2 border-t border-line pt-4">
          <div
            data-tutorial-target="buy-amount"
            class="flex items-center justify-between gap-4"
          >
            <span class="text-h2 text-muted">총 주문 금액</span>
            <strong class="text-amount text-ink tabular-nums">
              {{ formatCurrency(orderAmount) }}
            </strong>
          </div>
          <p class="text-right text-body text-muted tabular-nums">
            주문 가능 금액 {{ formatCurrency(availableAmount) }}
          </p>
        </div>

        <p v-if="errorMessage" class="text-caption text-error" role="alert">
          {{ errorMessage }}
        </p>

        <BottomButton
          data-tutorial-target="buy-submit"
          color="pink"
          :disabled="!canSubmit || isSubmitting"
          @click="submitOrder"
        >
          {{
            isOrderExceeded
              ? '주문 가능 금액을 초과했습니다'
              : isSubmitting
                ? '매수 처리 중...'
                : '매수하기'
          }}
        </BottomButton>
      </section>
    </template>
  </Teleport>
</template>

<style scoped>
.game-buy-quantity {
  appearance: textfield;
}

.game-buy-quantity::-webkit-inner-spin-button,
.game-buy-quantity::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}
</style>
