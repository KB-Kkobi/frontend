<script setup>
import { ref, computed, watch, onMounted, onActivated, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import TransactionCard from '@/components/transaction/TransactionCard.vue'
import TransactionSegment from '@/components/transaction/TransactionSegment.vue'
import ListToolbar from '@/components/common/ListToolbar.vue'
import FilterSheet from '@/components/common/FilterSheet.vue'
import SortToggle from '@/components/transaction/SortToggle.vue'
import { cancelOrder, fetchOrders } from '@/api/trade'
import { ORDER_STATUS, ORDER_ERROR_MESSAGE } from '@/constants/trade'
import { PERIOD_OPTIONS, STOCK_TYPE_OPTIONS, HISTORY_TYPE_OPTIONS } from '@/constants/transaction'
import { useHistoryOrders } from '@/composables/useHistoryOrders'

// ── props / emits ─────────────────────────────────────────────────────────────
// (없음)

const route = useRoute()

// ── composables · store ───────────────────────────────────────────────────────
const {
  filteredItems,
  normalizedItems,
  isLoading: isLoadingHistory,
  hasError,
  selectedTypes,
  sort: activeSort,
  loadHistory,
} = useHistoryOrders()

// ── 반응형 상태 ───────────────────────────────────────────────────────────────
const activeSegment = ref('history')
const activePeriod = ref('1m')
const selectedPendingTypes = ref([])
const showCancelModal = ref(false)
const cancelTargetId = ref(null)
const cancelError = ref(null)
const pendingOrders = ref([])
const isLoadingPending = ref(false)
const isCancelling = ref(false)
const isHistoryFilterOpen = ref(false)
const isPendingFilterOpen = ref(false)

// 알림(거래 체결)에서 들어왔을 때 해당 주문으로 스크롤 + 잠깐 하이라이트하기 위한 상태.
const highlightedItemId = ref(null)
let highlightTimer = null

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

// ── 필터 그룹 정의 ────────────────────────────────────────────────────────────
const historyFilterGroups = [
  {
    key: 'period',
    label: '기간',
    multiple: false,
    cols: 2,
    color: 'pink',
    options: PERIOD_OPTIONS.map((o) => ({ value: o.key, label: o.label })),
  },
  {
    key: 'types',
    label: '종류',
    multiple: true,
    cols: 3,
    color: 'pink',
    options: HISTORY_TYPE_OPTIONS.map((o) => ({ value: o.key, label: o.label })),
  },
]

const pendingFilterGroups = [
  {
    key: 'types',
    label: '종류',
    multiple: true,
    cols: 2,
    color: 'pink',
    options: STOCK_TYPE_OPTIONS.map((o) => ({ value: o.key, label: o.label })),
  },
]

const historyFilterValue = computed(() => ({
  period: activePeriod.value ? [activePeriod.value] : [],
  types: [...selectedTypes.value],
}))

const pendingFilterValue = computed(() => ({
  types: [...selectedPendingTypes.value],
}))

const historyFilterCount = computed(
  () => (activePeriod.value !== '1m' ? 1 : 0) + selectedTypes.value.length,
)

const pendingFilterCount = computed(() => selectedPendingTypes.value.length)

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

function orderTypeLabel(orderType) {
  if (!orderType) return ''
  return orderType === 'BUY' ? '매수' : '매도'
}

function orderMethodLabel(orderMethod) {
  if (!orderMethod) return ''
  return orderMethod === 'MARKET' ? '시장가' : '지정가'
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
    const code = err?.code ?? null
    cancelError.value =
      err?.serverMessage ||
      (code && ORDER_ERROR_MESSAGE[code]) ||
      ORDER_ERROR_MESSAGE.ORDER_NOT_CANCELABLE
    console.error('[VirtualHistoryView] 주문 취소 실패', err)
  } finally {
    isCancelling.value = false
    cancelTargetId.value = null
  }
}

// ── 필터 적용 ─────────────────────────────────────────────────────────────────
function handleHistoryFilterApply(result) {
  activePeriod.value = result.period?.[0] ?? '1m'
  selectedTypes.value = result.types ?? []
}

function handlePendingFilterApply(result) {
  selectedPendingTypes.value = result.types ?? []
}

// ── 알림 딥링크 처리 ─────────────────────────────────────────────────────────────
// 알림 클릭(/virtual/history?segment=history&type=stock&orderId=123)으로 들어왔을 때
// 반드시 history 탭 + 주식 필터가 선택되도록 하고, 해당 주문이 있으면 스크롤 + 하이라이트한다.
// 라우트 진입 시 한 번만 반영하면 되므로 onMounted에서 처리하고 query를 지켜보진 않는다.
function applyNotificationQuery() {
  activeSegment.value = route.query.segment === 'pending' ? 'pending' : 'history'

  if (route.query.type) {
    selectedTypes.value = String(route.query.type).split(',').filter(Boolean)
  }

  if (route.query.orderId) {
    highlightedItemId.value = `STOCK-${route.query.orderId}`
  }
}

// ── watch ─────────────────────────────────────────────────────────────────────
watch(activePeriod, () => {
  if (activeSegment.value === 'history') {
    loadHistory(periodFromDate.value)
  }
})

watch(activeSegment, (newSegment) => {
  if (newSegment === 'history') {
    loadHistory(periodFromDate.value)
  } else if (newSegment === 'pending') {
    loadPendingOrders()
  }
})

watch(filteredItems, (items) => {
  if (!highlightedItemId.value) return
  if (!items.some((item) => item.id === highlightedItemId.value)) return

  const targetId = highlightedItemId.value
  nextTick(() => {
    document
      .getElementById(`history-item-${targetId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })

  if (highlightTimer !== null) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    highlightedItemId.value = null
    highlightTimer = null
  }, 1000)
})

// ── lifecycle ─────────────────────────────────────────────────────────────────
// keep-alive 안에서는 onActivated가 최초 mount 시에도 onMounted 직후 호출된다.
// 아무 guard 없이 두 훅에서 모두 조회하면 최초 진입에서 같은 데이터를 두 번
// 연속 요청하게 되어(중복 API 호출 + isLoading 재토글) 진입 순간 UI가 깜빡이는
// 원인이 된다. 최초 활성화는 onMounted가 이미 처리했으므로 건너뛰고,
// 이후 재진입(다른 탭 갔다가 돌아오는 경우)부터만 최신화한다.
let isFirstActivation = true

onMounted(() => {
  applyNotificationQuery()
  loadHistory(periodFromDate.value)
  loadPendingOrders()
})

// keep-alive 재진입 시 내역 최신화. 탭 전환 CSS transition과 같은 프레임에 무거운
// 목록 재조회·재렌더링이 겹치면 애니메이션 첫 프레임이 끊겨 보일 수 있어, 한 프레임
// 미뤄서 transition이 먼저 시작된 뒤에 데이터 갱신이 뒤따르게 한다.
onActivated(() => {
  if (isFirstActivation) {
    isFirstActivation = false
    return
  }

  requestAnimationFrame(() => {
    if (activeSegment.value === 'history') {
      loadHistory(periodFromDate.value)
    } else {
      loadPendingOrders()
    }
  })
})

onBeforeUnmount(() => {
  if (highlightTimer !== null) {
    clearTimeout(highlightTimer)
    highlightTimer = null
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <TransactionSegment v-model="activeSegment" />

    <!-- 필터 영역 -->
    <template v-if="activeSegment === 'history'">
      <ListToolbar
        :filter-active="historyFilterCount > 0"
        :filter-count="historyFilterCount"
        @filter="isHistoryFilterOpen = true"
      >
        <template #sort>
          <SortToggle v-model="activeSort" />
        </template>
      </ListToolbar>
    </template>
    <template v-else-if="activeSegment === 'pending'">
      <ListToolbar
        :show-sort="false"
        :filter-active="pendingFilterCount > 0"
        :filter-count="pendingFilterCount"
        @filter="isPendingFilterOpen = true"
      />
    </template>

    <!-- 취소 에러 표시 -->
    <p v-if="cancelError" class="text-caption text-error text-center tracking-tight">
      {{ cancelError }}
    </p>

    <!-- 거래 내역 탭 -->
    <div v-if="activeSegment === 'history'" class="flex flex-col gap-4">
      <BaseCard v-if="isLoadingHistory" color="white">
        <p class="text-caption text-muted">내역을 불러오는 중이에요...</p>
      </BaseCard>

      <template v-else-if="filteredItems.length === 0">
        <BaseCard color="white">
          <div class="flex flex-col gap-2">
            <p class="text-body text-muted tracking-tight">
              {{ normalizedItems.length === 0 ? '거래 내역이 없어요' : '검색 결과가 없어요' }}
            </p>
            <p class="text-caption text-muted tracking-tight">
              {{
                normalizedItems.length === 0
                  ? '아직 주식 거래나 예금·적금 거래가 없습니다.'
                  : '선택한 필터 조건에 맞는 내역이 없습니다.'
              }}
            </p>
          </div>
        </BaseCard>
      </template>

      <TransactionCard
        v-for="item in filteredItems"
        :id="`history-item-${item.id}`"
        :key="item.id"
        :name="item.name"
        :sub-label="item.subLabel"
        :pill="item.pill"
        :datetime="item.datetime"
        :stats="item.stats"
        :highlighted="item.id === highlightedItemId"
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

    <!-- FilterSheet·BaseModal은 내부적으로 <Teleport to="body">를 쓰고 닫혀있을 때는
         v-if로 아예 렌더링되지 않으므로, 여기 이 div 안에 둬도 화면 위치·레이아웃·평소
         렌더링 비용에는 영향이 없다. 대신 이 컴포넌트의 template root를 하나로 유지해야
         상위 <Transition>이 자산현황·투자하기와 동일하게 enter/leave 애니메이션을
         적용한다 — root가 여러 개(fragment)면 Vue가 애니메이션 자체를 건너뛴다. -->
    <FilterSheet
      :open="isHistoryFilterOpen"
      title="필터"
      description="기간과 종류를 함께 선택할 수 있어요."
      :groups="historyFilterGroups"
      :model-value="historyFilterValue"
      @update:open="isHistoryFilterOpen = $event"
      @apply="handleHistoryFilterApply"
    />
    <FilterSheet
      :open="isPendingFilterOpen"
      title="필터"
      :groups="pendingFilterGroups"
      :model-value="pendingFilterValue"
      @update:open="isPendingFilterOpen = $event"
      @apply="handlePendingFilterApply"
    />

    <!-- 주문 취소 확인 모달 -->
    <BaseModal
      v-model="showCancelModal"
      message="주문을 취소하시겠어요?"
      confirm-text="주문 취소"
      cancel-text="돌아가기"
      confirm-color="pink"
      @confirm="handleConfirmCancel"
    />
  </div>
</template>
