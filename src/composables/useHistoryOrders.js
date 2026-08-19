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

  // 최초 조회 여부. keep-alive 재진입마다 onActivated에서 다시 호출되는데, 이미 목록이
  // 떠 있는 상태에서까지 로딩 카드로 바꿔치기하면 탭을 다시 들어갈 때마다 기존 내역이
  // "잠깐 보였다가 사라지는" 것처럼 보인다. 최초 조회일 때만 로딩 카드를 보여주고,
  // 재조회는 화면을 그대로 둔 채 조용히 최신화한다.
  let hasLoadedOnce = false

  async function loadHistory(fromDate) {
    const isInitialLoad = !hasLoadedOnce

    if (isInitialLoad) {
      isLoading.value = true
      hasError.value = false
    }
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
      hasLoadedOnce = true
    } catch (err) {
      if (!isInitialLoad) {
        // 백그라운드 재조회 실패는 화면에 이미 떠 있는 목록을 그대로 유지한다.
        console.error('[useHistoryOrders] 내역 재조회 실패', err)
        return
      }
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
