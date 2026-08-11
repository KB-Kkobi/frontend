<script setup>
import { ref, computed, watch, onMounted, onActivated } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import TransactionCard from '@/components/transaction/TransactionCard.vue'
import TransactionSegment from '@/components/transaction/TransactionSegment.vue'
import PeriodFilter from '@/components/transaction/PeriodFilter.vue'
import SortToggle from '@/components/transaction/SortToggle.vue'
import StockTypeFilter from '@/components/transaction/StockTypeFilter.vue'
import { fetchOrders, cancelOrder } from '@/api/trade'
import { ORDER_STATUS, ORDER_ERROR_MESSAGE } from '@/constants/trade'
import { PERIOD_OPTIONS } from '@/constants/transaction'

// ── 반응형 상태 ───────────────────────────────────────────────────────────────
const activeSegment = ref('history')
const activePeriod = ref('1m')
const activeSort = ref('desc')
const selectedTypes = ref([])
const selectedPendingTypes = ref([])
const showCancelModal = ref(false)
const cancelTargetId = ref(null)
const cancelError = ref(null)

const historyOrders = ref([])
const pendingOrders = ref([])
const isLoadingHistory = ref(false)
const isLoadingPending = ref(false)
const isCancelling = ref(false)

// ── computed ─────────────────────────────────────────────────────────────────
const periodFromDate = computed(() => {
  const now = new Date()
  const option = PERIOD_OPTIONS.find((o) => o.key === activePeriod.value)
  if (!option) return undefined

  const from = new Date(now)
  if (activePeriod.value === '1w') from.setDate(from.getDate() - 7)
  else if (activePeriod.value === '1m') from.setMonth(from.getMonth() - 1)
  else if (activePeriod.value === '3m') from.setMonth(from.getMonth() - 3)
  else if (activePeriod.value === '6m') from.setMonth(from.getMonth() - 6)

  return from.toISOString().slice(0, 10)
})

// ── 유틸 함수 ─────────────────────────────────────────────────────────────────
function formatDatetime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return isoString
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

function formatPrice(value) {
  if (value === null || value === undefined) return '--'
  return `${Number(value).toLocaleString('ko-KR')}원`
}

function statusLabel(status) {
  if (status === ORDER_STATUS.FILLED) return '체결'
  if (status === ORDER_STATUS.CANCELLED) return '사용자 취소'
  if (status === ORDER_STATUS.EXPIRED) return '장마감 만료'
  if (status === ORDER_STATUS.PENDING) return '대기중'
  if (status === ORDER_STATUS.REJECTED) return '거부됨'
  return status ?? ''
}

function statusPillColor(status) {
  if (status === ORDER_STATUS.FILLED) return 'green'
  if (status === ORDER_STATUS.PENDING) return 'yellow'
  if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.EXPIRED) return 'blue'
  return 'pink'
}

function orderTypeLabel(orderType) {
  if (!orderType) return ''
  return orderType === 'BUY' ? '매수' : '매도'
}

function orderMethodLabel(orderMethod) {
  if (!orderMethod) return ''
  return orderMethod === 'MARKET' ? '시장가' : '지정가'
}

function buildHistoryStats(order) {
  const stats = [
    { label: '수량', value: order.quantity != null ? `${order.quantity}주` : '--' },
    { label: '주문 방식', value: orderMethodLabel(order.orderMethod) },
  ]
  if (order.price != null) {
    stats.push({ label: '주문 단가', value: formatPrice(order.price) })
  }
  if (order.filledPrice != null) {
    stats.push({ label: '체결 단가', value: formatPrice(order.filledPrice) })
  }
  if (order.totalAmount != null) {
    stats.push({ label: '거래 금액', value: formatPrice(order.totalAmount) })
  }
  return stats
}

function buildPendingStats(order) {
  return [
    { label: '주문 수량', value: order.quantity != null ? `${order.quantity}주` : '--' },
    { label: '주문 가격', value: order.price != null ? formatPrice(order.price) : '시장가' },
    { label: '주문 방식', value: orderMethodLabel(order.orderMethod) },
  ]
}

function normalizeOrders(data) {
  if (Array.isArray(data?.orders)) return data.orders
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data)) return data
  return []
}

// ── 데이터 조회 ──────────────────────────────────────────────────────────────
async function loadHistoryOrders() {
  isLoadingHistory.value = true
  try {
    const params = {
      from: periodFromDate.value,
      sort: activeSort.value,
    }
    const data = await fetchOrders(params)
    historyOrders.value = normalizeOrders(data)
  } catch (err) {
    console.error('[VirtualHistoryView] 거래 내역 조회 실패', err)
    historyOrders.value = []
  } finally {
    isLoadingHistory.value = false
  }
}

async function loadPendingOrders() {
  isLoadingPending.value = true
  try {
    const data = await fetchOrders({ status: ORDER_STATUS.PENDING })
    pendingOrders.value = normalizeOrders(data)
  } catch (err) {
    console.error('[VirtualHistoryView] 미체결 주문 조회 실패', err)
    pendingOrders.value = []
  } finally {
    isLoadingPending.value = false
  }
}

// ── 주문 취소 ─────────────────────────────────────────────────────────────────
function handleCancelRequest(orderId) {
  cancelTargetId.value = orderId
  cancelError.value = null
  showCancelModal.value = true
}

async function handleConfirmCancel() {
  if (!cancelTargetId.value) return
  isCancelling.value = true
  cancelError.value = null
  try {
    await cancelOrder(cancelTargetId.value)
    await loadPendingOrders()
  } catch (err) {
    const code = err?.data?.code ?? err?.data?.errorCode ?? null
    cancelError.value =
      (code && ORDER_ERROR_MESSAGE[code]) || ORDER_ERROR_MESSAGE.ORDER_NOT_CANCELABLE
    console.error('[VirtualHistoryView] 주문 취소 실패', err)
  } finally {
    isCancelling.value = false
    cancelTargetId.value = null
  }
}

// ── watch ─────────────────────────────────────────────────────────────────────
watch([activePeriod, activeSort], () => {
  if (activeSegment.value === 'history') {
    loadHistoryOrders()
  }
})

watch(activeSegment, (newSegment) => {
  if (newSegment === 'history') {
    loadHistoryOrders()
  } else if (newSegment === 'pending') {
    loadPendingOrders()
  }
})

// ── lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  loadHistoryOrders()
  loadPendingOrders()
})

// keep-alive 재진입 시 내역 최신화
onActivated(() => {
  if (activeSegment.value === 'history') {
    loadHistoryOrders()
  } else {
    loadPendingOrders()
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <TransactionSegment v-model="activeSegment" />

    <!-- 필터 영역 -->
    <div class="flex min-h-12 items-center gap-2">
      <template v-if="activeSegment === 'history'">
        <div class="min-w-0 flex-1"><PeriodFilter v-model="activePeriod" /></div>
        <div class="min-w-0 flex-1"><StockTypeFilter v-model="selectedTypes" /></div>
        <SortToggle v-model="activeSort" />
      </template>
      <template v-else-if="activeSegment === 'pending'">
        <div class="ml-auto w-1/2 min-w-0"><StockTypeFilter v-model="selectedPendingTypes" /></div>
      </template>
    </div>

    <!-- 취소 에러 표시 -->
    <p v-if="cancelError" class="text-caption text-error text-center tracking-tight">
      {{ cancelError }}
    </p>

    <!-- 거래 내역 탭 -->
    <div v-if="activeSegment === 'history'" class="flex flex-col gap-4">
      <BaseCard v-if="isLoadingHistory" color="white">
        <p class="text-caption text-muted">내역을 불러오는 중이에요...</p>
      </BaseCard>

      <BaseCard v-else-if="historyOrders.length === 0" color="white">
        <div class="flex flex-col gap-2">
          <p class="text-body text-muted tracking-tight">거래 내역이 없어요</p>
          <p class="text-caption text-muted tracking-tight">선택한 기간의 거래 내역이 없습니다.</p>
        </div>
      </BaseCard>

      <TransactionCard
        v-for="order in historyOrders"
        :key="order.securityOrderId ?? order.id"
        :name="order.securityName ?? order.name ?? order.ticker ?? '--'"
        :sub-label="order.ticker ?? ''"
        :pill="{
          label: statusLabel(order.status),
          color: statusPillColor(order.status),
        }"
        :datetime="formatDatetime(order.createdAt ?? order.orderedAt)"
        :stats="buildHistoryStats(order)"
      />
    </div>

    <!-- 미체결 주문 탭 -->
    <div v-else-if="activeSegment === 'pending'" class="flex flex-col gap-4">
      <BaseCard v-if="isLoadingPending" color="white">
        <p class="text-caption text-muted">미체결 주문을 불러오는 중이에요...</p>
      </BaseCard>

      <BaseCard v-else-if="pendingOrders.length === 0" color="white">
        <div class="flex flex-col gap-2">
          <p class="text-body text-muted tracking-tight">대기 중인 주문이 없어요</p>
          <p class="text-caption text-muted tracking-tight">지정가 주문이 접수되면 여기에 표시됩니다.</p>
        </div>
      </BaseCard>

      <TransactionCard
        v-for="order in pendingOrders"
        :key="order.securityOrderId ?? order.id"
        :name="order.securityName ?? order.name ?? order.ticker ?? '--'"
        :sub-label="order.ticker ?? ''"
        :pill="{ label: orderTypeLabel(order.orderType), color: order.orderType === 'BUY' ? 'pink' : 'blue' }"
        :datetime="formatDatetime(order.createdAt ?? order.orderedAt)"
        :stats="buildPendingStats(order)"
        :is-cancelable="true"
        cancel-text="주문 취소"
        @cancel="handleCancelRequest(order.securityOrderId ?? order.id)"
      />
    </div>
  </div>

  <!-- 주문 취소 확인 모달 -->
  <BaseModal
    v-model="showCancelModal"
    message="주문을 취소하시겠어요?"
    confirm-text="주문 취소"
    cancel-text="돌아가기"
    confirm-color="pink"
    @confirm="handleConfirmCancel"
  />
</template>
