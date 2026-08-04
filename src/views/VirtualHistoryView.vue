<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import TransactionCard from '@/components/transaction/TransactionCard.vue'
import TransactionSegment from '@/components/transaction/TransactionSegment.vue'
import PeriodFilter from '@/components/transaction/PeriodFilter.vue'
import SortToggle from '@/components/transaction/SortToggle.vue'
import StockTypeFilter from '@/components/transaction/StockTypeFilter.vue'

const activeSegment = ref('history')
const activePeriod = ref('1m')
const activeSort = ref('desc')
const selectedTypes = ref([])
const selectedPendingTypes = ref([])
const showCancelModal = ref(false)

function handleCancel() {
  showCancelModal.value = true
}

function handleConfirmCancel() {
  // TODO: 주문 취소 API 연동
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <TransactionSegment v-model="activeSegment" />
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

    <div v-if="activeSegment === 'history'" class="flex flex-col gap-4">
      <TransactionCard
        name="삼성전자"
        subLabel="005930"
        :pill="{ label: '주식', color: 'blue' }"
        datetime="2026.08.03 14:32"
        :stats="[
          { label: '수량', value: '10주' },
          { label: '평균 단가', value: '78,500원' },
          { label: '거래 금액', value: '785,000원' },
        ]"
      />
    </div>

    <div v-else-if="activeSegment === 'pending'" class="flex flex-col gap-4">
      <TransactionCard
        name="카카오"
        subLabel="035720"
        :pill="{ label: '주식', color: 'blue' }"
        datetime="2026.08.03 15:10"
        :stats="[
          { label: '주문 수량', value: '5주' },
          { label: '주문 가격', value: '55,000원' },
          { label: '현재가', value: '54,200원' },
        ]"
        :isCancelable="true"
        @cancel="handleCancel"
      />
    </div>
  </div>

  <BaseModal
    v-model="showCancelModal"
    message="주문을 취소하시겠어요?"
    confirmText="주문 취소"
    cancelText="돌아가기"
    @confirm="handleConfirmCancel"
  />
</template>
