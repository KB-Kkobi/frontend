<script setup>
import { watch } from 'vue'
import BaseBottomSheet from '@/components/common/BaseBottomSheet.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BottomButton from '@/components/common/BottomButton.vue'
import TradeSideToggle from '@/components/trade/TradeSideToggle.vue'
import TradeStockHeader from '@/components/trade/TradeStockHeader.vue'
import TradeMethodToggle from '@/components/trade/TradeMethodToggle.vue'
import TradePriceInput from '@/components/trade/TradePriceInput.vue'
import TradeQuantityInput from '@/components/trade/TradeQuantityInput.vue'
import TradeOrderSummary from '@/components/trade/TradeOrderSummary.vue'
import TradePortfolioImpact from '@/components/trade/TradePortfolioImpact.vue'
import { useTradeOrder } from '@/composables/useTradeOrder'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  securityId: { type: Number, required: true },
  ticker: { type: String, required: true },
  securityName: { type: String, default: '' },
  initialSide: {
    type: String,
    default: 'buy',
    validator: (v) => ['buy', 'sell'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue', 'ordered'])

const {
  currentPrice,
  changeRate,
  isFailed,
  side,
  method,
  quantity,
  limitPrice,
  isLoading,
  isSubmitting,
  orderError,
  orderableInfo,
  pricePerShare,
  orderAmount,
  maxQuantity,
  buttonLabel,
  buttonColor,
  isButtonDisabled,
  loadOrderable,
  submitOrder,
  resetState,
} = useTradeOrder({ securityId: props.securityId, ticker: props.ticker })

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    resetState(props.initialSide)
    isLoading.value = true
    await loadOrderable()
    isLoading.value = false
  },
)

async function handleConfirm() {
  const result = await submitOrder()
  if (result) {
    emit('ordered', result)
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <BaseBottomSheet :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="flex flex-col gap-4 py-2">
      <!-- 매수/매도 토글 -->
      <BaseCard color="white" elevation="flat">
        <TradeSideToggle :side="side" @update:side="(v) => (side = v)" />
      </BaseCard>

      <!-- 종목 헤더 -->
      <TradeStockHeader
        :name="securityName || ticker"
        :code="ticker"
        :current-price="currentPrice"
        :change-rate="changeRate"
      />

      <!-- 시세 지연 안내 -->
      <p v-if="isFailed" class="text-caption text-muted tracking-tight">
        시세 지연 중 — 마지막으로 수신된 가격이 표시됩니다.
      </p>

      <!-- 주문 입력 카드 -->
      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <TradeMethodToggle :method="method" @update:method="(v) => (method = v)" />
          <TradePriceInput
            :method="method"
            :market-price="currentPrice"
            :model-value="limitPrice"
            @update:model-value="(v) => (limitPrice = v)"
          />
          <TradeQuantityInput
            :model-value="quantity"
            :max-quantity="maxQuantity"
            @update:model-value="(v) => (quantity = v)"
          />
          <TradeOrderSummary
            :orderable-cash="orderableInfo.orderableCash"
            :price-per-share="pricePerShare"
            :quantity="quantity"
            :order-amount="orderAmount"
            :side="side"
            :sellable-quantity="orderableInfo.sellableQuantity"
          />
        </div>
      </BaseCard>

      <!-- 포트폴리오 영향 (데이터 미구현, 숨김 유지) -->
      <TradePortfolioImpact :show="false" />

      <!-- 에러 문구 -->
      <p v-if="orderError" class="text-caption text-error text-center tracking-tight">
        {{ orderError }}
      </p>

      <!-- 주문 버튼 -->
      <BottomButton
        :color="buttonColor"
        :disabled="isButtonDisabled"
        @click="handleConfirm"
      >
        {{ buttonLabel }}
      </BottomButton>
    </div>
  </BaseBottomSheet>
</template>
