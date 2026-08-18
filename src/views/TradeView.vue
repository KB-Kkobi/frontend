<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/common/BaseCard.vue'
import BottomButton from '@/components/common/BottomButton.vue'
import BackButton from '@/components/common/BackButton.vue'
import TradeSideToggle from '@/components/trade/TradeSideToggle.vue'
import TradeStockHeader from '@/components/trade/TradeStockHeader.vue'
import TradeMethodToggle from '@/components/trade/TradeMethodToggle.vue'
import TradePriceInput from '@/components/trade/TradePriceInput.vue'
import TradeQuantityInput from '@/components/trade/TradeQuantityInput.vue'
import TradeOrderSummary from '@/components/trade/TradeOrderSummary.vue'
import TradePortfolioImpact from '@/components/trade/TradePortfolioImpact.vue'
import { usePriceFeed } from '@/composables/usePriceFeed'
import { fetchOrderable, createOrder } from '@/api/trade'
import { fetchSecurityDetail } from '@/api/securityApi'
import { ORDER_TYPE, ORDER_METHOD, ORDER_STATUS, ORDER_ERROR_MESSAGE } from '@/constants/trade'

// ── 라우트 ───────────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

const securityId = Number(route.params.securityId)
const ticker = route.query.ticker ?? ''

// ── 실시간 시세 ───────────────────────────────────────────────────────────────
const { currentPrice, changeRate, isFailed } = usePriceFeed({ securityId, ticker })

// ── 반응형 상태 ───────────────────────────────────────────────────────────────
const side = ref(route.query.side === 'sell' ? 'sell' : 'buy')
const securityName = ref('')
const method = ref('limit')
const quantity = ref(1)
const limitPrice = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const orderError = ref(null)
const orderableInfo = ref({
  orderableCash: null,
  sellableQuantity: null,
  maxBuyQuantityAtMarket: null,
})

// ── computed ─────────────────────────────────────────────────────────────────
const pricePerShare = computed(() => {
  if (method.value === 'market') return currentPrice.value
  return limitPrice.value
})

const orderAmount = computed(() => {
  if (!pricePerShare.value || !quantity.value) return null
  return pricePerShare.value * quantity.value
})

const maxQuantity = computed(() => {
  if (side.value === 'sell') {
    return orderableInfo.value.sellableQuantity ?? 0
  }
  if (method.value === 'market') {
    return orderableInfo.value.maxBuyQuantityAtMarket ?? 0
  }
  // 매수 + 지정가
  if (!limitPrice.value || !orderableInfo.value.orderableCash) return 0
  return Math.floor(orderableInfo.value.orderableCash / limitPrice.value)
})

const buttonLabel = computed(() => (side.value === 'buy' ? '매수하기' : '매도하기'))

const buttonColor = computed(() => (side.value === 'buy' ? 'pink' : 'blue'))

const isButtonDisabled = computed(() => isLoading.value || isSubmitting.value || quantity.value === 0)

// ── watch ────────────────────────────────────────────────────────────────────
watch(side, () => {
  quantity.value = maxQuantity.value > 0 ? 1 : 0
  orderError.value = null
})

watch(maxQuantity, (newMax, oldMax) => {
  if (newMax === 0) {
    quantity.value = 0
  } else if (oldMax === 0 && quantity.value === 0) {
    quantity.value = 1
  }
})

watch(currentPrice, (price) => {
  if (price !== null) limitPrice.value = price
}, { once: true })

watch(method, () => {
  if (method.value === 'limit' && limitPrice.value === null) {
    limitPrice.value = currentPrice.value ?? null
  }
  quantity.value = maxQuantity.value > 0 ? 1 : 0
  orderError.value = null
})

watch(limitPrice, () => {
  if (quantity.value > maxQuantity.value) {
    quantity.value = maxQuantity.value
  }
})

// ── 함수 ─────────────────────────────────────────────────────────────────────
async function loadOrderable() {
  try {
    const data = await fetchOrderable(securityId)
    orderableInfo.value = {
      orderableCash: data.orderableCash ?? null,
      sellableQuantity: data.sellableQuantity ?? null,
      maxBuyQuantityAtMarket: data.maxBuyQuantityAtMarket ?? null,
    }
  } catch (err) {
    console.error('[TradeView] fetchOrderable 실패', err)
  }
}

async function submitOrder() {
  orderError.value = null

  if (quantity.value <= 0) {
    orderError.value = ORDER_ERROR_MESSAGE.INVALID_QUANTITY
    return
  }
  if (method.value === 'limit' && !limitPrice.value) {
    orderError.value = ORDER_ERROR_MESSAGE.PRICE_REQUIRED_FOR_LIMIT
    return
  }

  isSubmitting.value = true

  try {
    // 주문 직전 최신 주문가능 정보 재조회
    await loadOrderable()

    const orderPayload = {
      securityId,
      orderType: side.value === 'buy' ? ORDER_TYPE.BUY : ORDER_TYPE.SELL,
      orderMethod: method.value === 'market' ? ORDER_METHOD.MARKET : ORDER_METHOD.LIMIT,
      quantity: quantity.value,
    }
    if (method.value === 'limit') {
      orderPayload.price = limitPrice.value
    }

    const result = await createOrder(orderPayload)

    if (result?.status === ORDER_STATUS.FILLED) {
      router.push({ name: 'virtual-assets' })
    } else {
      // PENDING: 현재 화면 유지, 수량 리셋, fetchOrderable 재조회
      limitPrice.value = null
      quantity.value = maxQuantity.value > 0 ? 1 : 0
      await loadOrderable()
    }
  } catch (err) {
    const code = err?.code ?? null
    orderError.value =
      err?.serverMessage ||
      (code && ORDER_ERROR_MESSAGE[code]) ||
      ORDER_ERROR_MESSAGE.QUOTE_UNAVAILABLE
  } finally {
    isSubmitting.value = false
  }
}

// ── lifecycle ────────────────────────────────────────────────────────────────
isLoading.value = true
if (ticker) {
  fetchSecurityDetail(ticker)
    .then((detail) => { securityName.value = detail.name || ticker })
    .catch(() => { securityName.value = ticker })
}
loadOrderable().finally(() => {
  isLoading.value = false
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 뒤로가기 -->
    <div class="flex items-center">
      <BackButton />
    </div>

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

    <!-- 포트폴리오 영향 (데이터 없으면 숨김) -->
    <TradePortfolioImpact :show="false" />

    <!-- 에러 문구 -->
    <p v-if="orderError" class="text-caption text-error text-center tracking-tight">
      {{ orderError }}
    </p>

    <!-- 주문 버튼 -->
    <BottomButton
      :color="buttonColor"
      :disabled="isButtonDisabled"
      @click="submitOrder"
    >
      {{ buttonLabel }}
    </BottomButton>
  </div>
</template>
