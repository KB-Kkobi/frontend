<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseToast from '@/components/common/BaseToast.vue'
import BottomButton from '@/components/common/BottomButton.vue'
import AssetCompositionCard from '@/components/virtual/AssetCompositionCard.vue'
import HoldingPreviewSection from '@/components/virtual/HoldingPreviewSection.vue'
import StockHoldingRow from '@/components/virtual/StockHoldingRow.vue'
import ProductHoldingPreviewRow from '@/components/product/ProductHoldingPreviewRow.vue'
import { INITIAL_SEED_MONEY } from '@/constants/account'
import { PRODUCT_TYPES } from '@/constants/product'
import { formatCurrency, formatRate, formatSignedCurrency } from '@/utils/format'
import { useVirtualAssets } from '@/composables/useVirtualAssets'

// 자산현황 대시보드에서 미리보기로 노출하는 보유자산 최대 개수
const HOLDING_PREVIEW_LIMIT = 3

// 완료 직후 쿼리로 전달되는 알림. 한 번에 하나만 노출된다.
const COMPLETION_TOASTS = {
  started: {
    title: '가상투자 계좌가 만들어졌어요',
    description: `초기 자산 ${formatCurrency(INITIAL_SEED_MONEY)}이 계좌에 반영됐습니다.`,
  },
  subscribed: {
    title: '상품 가입이 완료됐어요',
    description: '사용 가능한 현금과 보유 예금·적금 목록을 다시 불러왔습니다.',
  },
  terminated: {
    title: '상품 해지가 완료됐어요',
    description: '반환 금액과 변경된 자산 비중을 다시 불러왔습니다.',
  },
}

const route = useRoute()
const router = useRouter()

const { account, stockHoldings, productHoldings, isLoading, isAccountMissing, errorMessage, loadAssets } = useVirtualAssets()

const isToastVisible = ref(false)
const toastContent = ref({ title: '', description: '' })

const profitColorClass = computed(() => {
  const profit = Number(account.value?.totalProfit)
  if (isNaN(profit)) return 'text-muted'
  if (profit > 0) return 'text-profit'
  if (profit < 0) return 'text-loss'
  return 'text-muted'
})

const stockPreview = computed(() => stockHoldings.value.slice(0, HOLDING_PREVIEW_LIMIT))
const productPreview = computed(() => productHoldings.value.slice(0, HOLDING_PREVIEW_LIMIT))
const investedAmount = computed(() => {
  const stockAsset = Number(account.value?.stockAsset)
  const savingsAsset = Number(account.value?.savingsAsset)

  return (
    (Number.isFinite(stockAsset) ? stockAsset : 0) +
    (Number.isFinite(savingsAsset) ? savingsAsset : 0)
  )
})

// 계좌가 없는 사용자는 자산현황 대신 가상투자 시작 화면을 먼저 보여준다.
watch(isAccountMissing, (missing) => {
  if (missing) router.replace({ name: 'virtual-start' })
})

// 완료 알림을 한 번만 띄우고, 재진입 시 다시 뜨지 않도록 쿼리를 정리한다.
function showCompletionToastIfNeeded() {
  const toastKey = Object.keys(COMPLETION_TOASTS).find(
    (key) => route.query[key] === 'true',
  )
  if (!toastKey) return

  toastContent.value = COMPLETION_TOASTS[toastKey]
  isToastVisible.value = true

  const query = { ...route.query }
  delete query[toastKey]
  router.replace({ query })
}

function handleBrowseStocks() {
  router.push({ name: 'virtual-products' })
}

function handleBrowseSavings() {
  router.push({
    name: 'virtual-products',
    query: { tab: PRODUCT_TYPES.DEPOSIT },
  })
}

function handleSelectStock(holding) {
  if (!holding.ticker) return
  router.push({
    name: 'security-detail',
    params: { pk: holding.ticker },
    query: { tradable: 'true' },
  })
}

function handleSelectHolding(holding) {
  router.push({ name: 'product-holding-detail', params: { holdingProductId: holding.holdingProductId } })
}

onMounted(() => {
  loadAssets()
  showCompletionToastIfNeeded()
})

onActivated(() => {
  loadAssets()
  showCompletionToastIfNeeded()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 로딩 -->
    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">가상투자 자산을 불러오고 있어요</h2>
        <p class="text-caption text-muted">계좌와 보유 상품의 최신 상태를 확인합니다.</p>
      </div>
    </BaseCard>

    <!-- 에러 -->
    <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">자산 현황을 확인할 수 없어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadAssets">다시 시도하기</BottomButton>
      </div>
    </BaseCard>

    <!-- 계좌 없을 때는 가상투자 시작 화면으로 이동하므로 별도 렌더링하지 않는다 -->

    <!-- 계좌 있을 때 -->
    <template v-else-if="account">
      <!-- 계좌 요약: 총 자산을 가장 크게, 손익·수익률은 같은 기준선으로 정렬 -->
      <BaseCard color="white" elevation="highlight">
        <div class="flex flex-col gap-4">
          <h2 class="text-h2 text-ink">내 가상투자 계좌</h2>
          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">총 자산</span>
            <strong class="text-amount text-ink tabular-nums">{{ formatCurrency(account.totalAsset) }}</strong>
          </div>
          <dl class="grid grid-cols-2 gap-4 border-t border-line-soft pt-4">
            <div class="flex flex-col gap-2">
              <dt class="text-caption text-muted">사용 가능</dt>
              <dd class="text-h2 text-ink tabular-nums">
                {{ formatCurrency(account.cashBalance) }}
              </dd>
            </div>
            <div class="flex flex-col gap-2 border-l border-line-soft pl-4">
              <dt class="text-caption text-muted">투자 중</dt>
              <dd class="text-h2 text-ink tabular-nums">
                {{ formatCurrency(investedAmount) }}
              </dd>
            </div>
          </dl>
          <div class="flex items-baseline justify-between gap-4 border-t border-line-soft pt-4">
            <div class="flex items-baseline gap-2">
              <span class="text-caption text-muted">누적 손익</span>
              <strong :class="[profitColorClass, 'text-body tabular-nums']">
                {{ formatSignedCurrency(account.totalProfit) }}
              </strong>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-caption text-muted">수익률</span>
              <strong :class="[profitColorClass, 'text-body tabular-nums']">
                {{ formatRate(Number(account.totalReturnRate)) }}
              </strong>
            </div>
          </div>
          <p class="flex items-start gap-2 text-caption text-muted tracking-tight">
            <span aria-hidden="true">ⓘ</span>
            <span>실제 돈이 사용되지 않는 가상투자 서비스예요.</span>
          </p>
        </div>
      </BaseCard>

      <!-- 자산 구성 카드 -->
      <AssetCompositionCard
        :cash-balance="account.cashBalance"
        :cash-ratio="Number(account.cashRatio)"
        :stock-asset="account.stockAsset"
        :stock-ratio="Number(account.stockRatio)"
        :savings-asset="account.savingsAsset"
        :savings-ratio="Number(account.savingsRatio)"
      />

      <!-- 보유 주식 미리보기 -->
      <HoldingPreviewSection
        title="보유 주식"
        :more-to="{ name: 'stock-holdings' }"
        more-label="내 주식 보기"
        :show-more="stockHoldings.length > 0"
        :items="stockPreview"
        :item-key="(item) => item.securityId ?? item.ticker"
        empty-title="아직 보유한 주식이 없어요"
        empty-description="가상 자산으로 첫 주식 투자를 시작해보세요."
        empty-action-label="주식 투자해보기"
        @select-item="handleSelectStock"
        @empty-action="handleBrowseStocks"
      >
        <template #item="{ item }">
          <StockHoldingRow :holding="item" />
        </template>
      </HoldingPreviewSection>

      <!-- 보유 예·적금 미리보기 -->
      <HoldingPreviewSection
        title="보유 예·적금"
        :more-to="{ name: 'product-holdings' }"
        more-label="내 예·적금 보기"
        :show-more="productHoldings.length > 0"
        :items="productPreview"
        :item-key="(item) => item.holdingProductId"
        empty-title="가입한 예·적금이 없어요"
        empty-description="가상 자산으로 첫 예·적금 가입을 시작해보세요."
        empty-action-label="예·적금 가입해보기"
        @select-item="handleSelectHolding"
        @empty-action="handleBrowseSavings"
      >
        <template #item="{ item }">
          <ProductHoldingPreviewRow :holding="item" />
        </template>
      </HoldingPreviewSection>
    </template>

    <!-- 계좌 생성·상품 가입·해지 완료 토스트 -->
    <BaseToast
      v-model="isToastVisible"
      :title="toastContent.title"
      :description="toastContent.description"
      offset="header"
    />
  </div>
</template>
