import { ref, computed } from 'vue'
import { fetchOrders } from '@/api/trade'
import { fetchProductHoldingHistory } from '@/api/productApi'
import { ORDER_STATUS } from '@/constants/trade'
import {
  normalizeStockOrder,
  normalizeProductHistory,
  filterByPeriod,
  filterByTypes,
  sortItems,
} from '@/utils/historyNormalizer'

export function useHistoryOrders() {
  const rawStockOrders = ref([])
  const rawProductHistory = ref([])
  const isLoading = ref(false)
  const hasError = ref(false)

  // 파이프라인 입력 (뷰에서 바인딩)
  const fromDateStr = ref(undefined) // YYYY-MM-DD
  const selectedTypes = ref([])
  const sort = ref('desc')

  const normalizedItems = computed(() => {
    const stockItems = rawStockOrders.value.map(normalizeStockOrder).filter(Boolean)
    const productItems = rawProductHistory.value.map(normalizeProductHistory).filter(Boolean)
    return [...stockItems, ...productItems]
  })

  const filteredItems = computed(() => {
    let items = normalizedItems.value
    items = filterByPeriod(items, fromDateStr.value)
    items = filterByTypes(items, selectedTypes.value)
    items = sortItems(items, sort.value)
    return items
  })

  async function loadHistory(fromDate) {
    isLoading.value = true
    hasError.value = false
    fromDateStr.value = fromDate

    try {
      const [stockData, productData] = await Promise.all([
        fetchOrders({
          from: fromDate,
          status: `${ORDER_STATUS.FILLED},${ORDER_STATUS.CANCELLED},${ORDER_STATUS.EXPIRED},${ORDER_STATUS.REJECTED}`,
        }),
        fetchProductHoldingHistory(),
      ])

      // fetchOrders 응답 정규화 (배열 추출)
      const orders = Array.isArray(stockData?.orders)
        ? stockData.orders
        : Array.isArray(stockData?.content)
          ? stockData.content
          : Array.isArray(stockData)
            ? stockData
            : []

      rawStockOrders.value = orders
      rawProductHistory.value = Array.isArray(productData) ? productData : []
    } catch (err) {
      console.error('[useHistoryOrders] 내역 조회 실패', err)
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  return {
    filteredItems,
    normalizedItems,
    isLoading,
    hasError,
    fromDateStr,
    selectedTypes,
    sort,
    loadHistory,
  }
}
