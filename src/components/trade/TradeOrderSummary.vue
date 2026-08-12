<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@/utils/format.js'

const props = defineProps({
  orderableCash: {
    type: Number,
    default: null,
  },
  pricePerShare: {
    type: Number,
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
  },
  orderAmount: {
    type: Number,
    default: null,
  },
  side: {
    type: String,
    required: true,
    validator: (v) => ['buy', 'sell'].includes(v),
  },
  sellableQuantity: {
    type: Number,
    default: null,
  },
})

const isBuy = computed(() => props.side === 'buy')

const topLabel = computed(() => (isBuy.value ? '주문 가능 금액' : '매도 가능 수량'))

const topValue = computed(() => {
  if (isBuy.value) {
    return props.orderableCash !== null ? formatCurrency(props.orderableCash) : '--'
  }
  return props.sellableQuantity !== null ? `${props.sellableQuantity}주` : '--'
})

const subLabel = computed(() => {
  const priceStr =
    props.pricePerShare !== null
      ? props.pricePerShare.toLocaleString('ko-KR') + '원'
      : '--'
  return `${priceStr} × ${props.quantity}주`
})

const formattedOrderAmount = computed(() => {
  return props.orderAmount !== null ? formatCurrency(props.orderAmount) : '--'
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 주문 가능 정보 -->
    <div class="flex items-center justify-between">
      <span class="text-body text-muted tracking-tight">{{ topLabel }}</span>
      <span class="text-body text-ink tabular-nums">{{ topValue }}</span>
    </div>

    <!-- 단가 × 수량 서브라벨 -->
    <span class="text-caption text-muted tabular-nums text-right">{{ subLabel }}</span>

    <!-- 구분선 -->
    <hr class="border-line" />

    <!-- 주문 금액 -->
    <div class="flex items-center justify-between">
      <span class="text-body font-semibold text-ink tracking-tight">주문 금액</span>
      <span class="text-amount text-ink tabular-nums">
        {{ formattedOrderAmount }}
      </span>
    </div>
  </div>
</template>
