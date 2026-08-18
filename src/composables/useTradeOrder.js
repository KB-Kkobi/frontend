import { ref, computed, watch } from 'vue'
import { usePriceFeed } from '@/composables/usePriceFeed'
import { fetchOrderable, createOrder } from '@/api/trade'
import { ORDER_TYPE, ORDER_METHOD, ORDER_STATUS, ORDER_ERROR_MESSAGE } from '@/constants/trade'

/**
 * 매매 주문 관련 상태·로직 composable.
 * TradeBottomSheet에서 사용하며, TradeView의 주문 로직과 동일한 동작을 제공합니다.
 *
 * @param {{ securityId: number, ticker: string }} params
 */
export function useTradeOrder({ securityId, ticker }) {
  const { currentPrice, changeRate, isFailed } = usePriceFeed({ securityId, ticker })

  // ── 주문 상태 ──────────────────────────────────────────────────────────────
  const side = ref('buy')
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

  // ── computed ───────────────────────────────────────────────────────────────
  const pricePerShare = computed(() =>
    method.value === 'market' ? currentPrice.value : limitPrice.value,
  )

  const orderAmount = computed(() => {
    if (!pricePerShare.value || !quantity.value) return null
    return pricePerShare.value * quantity.value
  })

  const maxQuantity = computed(() => {
    if (side.value === 'sell') return orderableInfo.value.sellableQuantity ?? 0
    if (method.value === 'market') return orderableInfo.value.maxBuyQuantityAtMarket ?? 0
    if (!limitPrice.value || !orderableInfo.value.orderableCash) return 0
    return Math.floor(orderableInfo.value.orderableCash / limitPrice.value)
  })

  const buttonLabel = computed(() => (side.value === 'buy' ? '매수하기' : '매도하기'))
  const buttonColor = computed(() => (side.value === 'buy' ? 'pink' : 'blue'))
  const isButtonDisabled = computed(
    () => isLoading.value || isSubmitting.value || quantity.value === 0,
  )

  // ── watch ──────────────────────────────────────────────────────────────────
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

  watch(
    currentPrice,
    (price) => {
      if (price !== null && limitPrice.value === null) limitPrice.value = price
    },
    { once: true },
  )

  watch(method, () => {
    if (method.value === 'limit' && limitPrice.value === null) {
      limitPrice.value = currentPrice.value ?? null
    }
    quantity.value = maxQuantity.value > 0 ? 1 : 0
    orderError.value = null
  })

  watch(limitPrice, () => {
    if (quantity.value > maxQuantity.value) quantity.value = maxQuantity.value
  })

  // ── 함수 ──────────────────────────────────────────────────────────────────
  async function loadOrderable() {
    try {
      const data = await fetchOrderable(securityId)
      orderableInfo.value = {
        orderableCash: data.orderableCash ?? null,
        sellableQuantity: data.sellableQuantity ?? null,
        maxBuyQuantityAtMarket: data.maxBuyQuantityAtMarket ?? null,
      }
    } catch (err) {
      console.error('[useTradeOrder] fetchOrderable 실패', err)
    }
  }

  /**
   * 주문 실행.
   * @returns {{ status: string, message: string } | null} 성공 시 객체, 실패 시 null
   */
  async function submitOrder() {
    orderError.value = null

    if (quantity.value <= 0) {
      orderError.value = ORDER_ERROR_MESSAGE.INVALID_QUANTITY
      return null
    }
    if (method.value === 'limit' && !limitPrice.value) {
      orderError.value = ORDER_ERROR_MESSAGE.PRICE_REQUIRED_FOR_LIMIT
      return null
    }

    isSubmitting.value = true

    try {
      await loadOrderable()

      const orderPayload = {
        securityId,
        orderType: side.value === 'buy' ? ORDER_TYPE.BUY : ORDER_TYPE.SELL,
        orderMethod: method.value === 'market' ? ORDER_METHOD.MARKET : ORDER_METHOD.LIMIT,
        quantity: quantity.value,
      }
      if (method.value === 'limit') orderPayload.price = limitPrice.value

      const result = await createOrder(orderPayload)
      const resultStatus = result?.status ?? result?.orderStatus

      const currentSide = side.value

      if (resultStatus === ORDER_STATUS.FILLED) {
        return { status: ORDER_STATUS.FILLED, side: currentSide }
      }

      // PENDING(지정가 예약 접수) 및 기타
      limitPrice.value = null
      quantity.value = maxQuantity.value > 0 ? 1 : 0
      await loadOrderable()
      return { status: resultStatus ?? ORDER_STATUS.PENDING, side: currentSide }
    } catch (err) {
      const code = err?.code ?? null
      orderError.value =
        err?.serverMessage ||
        (code && ORDER_ERROR_MESSAGE[code]) ||
        ORDER_ERROR_MESSAGE.QUOTE_UNAVAILABLE
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * 바텀시트를 다시 열 때 주문 입력 상태를 초기화합니다.
   * @param {string} newSide 'buy' | 'sell'
   */
  function resetState(newSide = 'buy') {
    side.value = newSide
    method.value = 'limit'
    quantity.value = 1
    limitPrice.value = currentPrice.value ?? null
    orderError.value = null
    orderableInfo.value = {
      orderableCash: null,
      sellableQuantity: null,
      maxBuyQuantityAtMarket: null,
    }
  }

  return {
    // 시세
    currentPrice,
    changeRate,
    isFailed,
    // 주문 상태
    side,
    method,
    quantity,
    limitPrice,
    isLoading,
    isSubmitting,
    orderError,
    orderableInfo,
    // computed
    pricePerShare,
    orderAmount,
    maxQuantity,
    buttonLabel,
    buttonColor,
    isButtonDisabled,
    // 함수
    loadOrderable,
    submitOrder,
    resetState,
  }
}
