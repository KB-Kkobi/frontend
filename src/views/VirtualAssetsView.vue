<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseToast from '@/components/common/BaseToast.vue'
import BottomButton from '@/components/common/BottomButton.vue'
import AssetCompositionCard from '@/components/virtual/AssetCompositionCard.vue'
import ProductHoldingCard from '@/components/product/ProductHoldingCard.vue'
import { INITIAL_SEED_MONEY } from '@/constants/account'
import { formatCurrency, formatRate, formatSignedCurrency } from '@/utils/format'
import { useVirtualAssets } from '@/composables/useVirtualAssets'

// 완료 직후 쿼리로 전달되는 알림. 한 번에 하나만 노출된다.
const COMPLETION_TOASTS = {
  started: {
    title: '가상투자 계좌가 만들어졌어요',
    description: `초기 자산 ${formatCurrency(INITIAL_SEED_MONEY)}이 계좌에 반영됐습니다.`,
  },
  subscribed: {
    title: '상품 가입이 완료됐어요',
    description: '사용 가능한 현금과 보유 예금·적금 목록을 서버에서 다시 불러왔습니다.',
  },
  terminated: {
    title: '상품 해지가 완료됐어요',
    description: '반환 금액과 변경된 자산 비중을 서버에서 다시 불러왔습니다.',
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

function handleBrowseProducts() {
  router.push({ name: 'products' })
}

function handleSelectHolding(holding) {
  router.push({ name: 'product-holding-detail', params: { holdingProductId: holding.holdingProductId } })
}

function handleHoldingTrade(holding) {
  if (!holding.securityId) return
  router.push({
    name: 'virtual-trade',
    params: { securityId: holding.securityId },
    query: { ticker: holding.ticker },
  })
}

function holdingAvgPrice(holding) {
  return holding.averagePrice ?? null
}

function holdingProfitRate(holding) {
  if (holding.profitRate !== undefined && holding.profitRate !== null) return holding.profitRate
  const avg = holdingAvgPrice(holding)
  if (holding.currentPrice !== null && avg) {
    return ((holding.currentPrice - avg) / avg) * 100
  }
  return null
}

function holdingProfitColorClass(holding) {
  const rate = holdingProfitRate(holding)
  if (rate === null) return 'text-muted'
  if (rate > 0) return 'text-profit'
  if (rate < 0) return 'text-loss'
  return 'text-muted'
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
      <!-- 계좌 요약 -->
      <BaseCard color="white" elevation="highlight">
        <div class="flex flex-col gap-4">
          <h2 class="text-h2 text-ink">내 가상투자 계좌</h2>
          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">총 자산</span>
            <strong class="text-amount text-ink tabular-nums">{{ formatCurrency(account.totalAsset) }}</strong>
          </div>
          <div class="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div class="flex flex-col gap-2">
              <span class="text-caption text-muted">누적 손익</span>
              <strong :class="[profitColorClass, 'text-body tabular-nums']">
                {{ formatSignedCurrency(account.totalProfit) }}
              </strong>
            </div>
            <div class="flex flex-col gap-2 text-right">
              <span class="text-caption text-muted">수익률</span>
              <strong :class="[profitColorClass, 'text-body tabular-nums']">
                {{ formatRate(Number(account.totalReturnRate)) }}
              </strong>
            </div>
          </div>
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

      <!-- 보유 종목 -->
      <section class="flex flex-col gap-4">
        <h2 class="text-h2 text-ink">보유 종목</h2>
        <BaseCard v-if="stockHoldings.length === 0" color="white" elevation="flat">
          <div class="flex flex-col gap-2">
            <p class="text-body text-muted tracking-tight">보유 중인 종목이 없어요</p>
            <p class="text-caption text-muted tracking-tight">상품 탭에서 종목을 찾아 투자해 보세요.</p>
          </div>
        </BaseCard>
        <BaseCard
          v-for="holding in stockHoldings"
          :key="holding.securityId ?? holding.ticker"
          color="white"
          elevation="flat"
        >
          <div class="flex flex-col gap-4">
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-2">
                <span class="text-h2 text-ink tracking-tight">{{ holding.name ?? holding.ticker }}</span>
                <span class="text-caption text-muted">{{ holding.ticker }}</span>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="text-body text-ink tabular-nums">
                  {{ holding.currentPrice !== null && holding.currentPrice !== undefined ? formatCurrency(holding.currentPrice) : '--' }}
                </span>
                <span :class="['text-caption tabular-nums', holdingProfitColorClass(holding)]">
                  {{ holdingProfitRate(holding) !== null ? formatRate(holdingProfitRate(holding)) : '--' }}
                </span>
              </div>
            </div>
            <div class="flex gap-4 border-t border-line pt-4">
              <div class="flex flex-1 flex-col gap-2">
                <span class="text-caption text-muted">보유 수량</span>
                <span class="text-body font-semibold tabular-nums">{{ holding.quantity }}주</span>
              </div>
              <div class="flex flex-1 flex-col gap-2">
                <span class="text-caption text-muted">평균 단가</span>
                <span class="text-body font-semibold tabular-nums">
                  {{ holdingAvgPrice(holding) !== null ? formatCurrency(holdingAvgPrice(holding)) : '--' }}
                </span>
              </div>
              <div class="flex flex-1 flex-col gap-2">
                <span class="text-caption text-muted">평가 금액</span>
                <span class="text-body font-semibold tabular-nums">
                  {{ holding.valuationAmount !== null && holding.valuationAmount !== undefined
                    ? formatCurrency(holding.valuationAmount)
                    : (holding.currentPrice !== null && holding.quantity
                      ? formatCurrency(holding.currentPrice * holding.quantity)
                      : '--') }}
                </span>
              </div>
            </div>
            <BottomButton v-if="holding.securityId" color="pink" @click="handleHoldingTrade(holding)">
              매수 / 매도
            </BottomButton>
          </div>
        </BaseCard>
      </section>

      <!-- 보유 예금·적금 -->
      <section class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-h2 text-ink">보유 예금·적금</h2>
          <span class="text-caption text-muted tabular-nums">{{ productHoldings.length }}개</span>
        </div>
        <div v-if="productHoldings.length" class="flex flex-col gap-4">
          <ProductHoldingCard
            v-for="holding in productHoldings"
            :key="holding.holdingProductId"
            :holding="holding"
            @select="handleSelectHolding"
          />
        </div>
        <BaseCard v-else color="yellow">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <h3 class="text-h2 text-ink">아직 가입한 예금·적금이 없어요</h3>
              <p class="text-caption text-muted">상품 탭에서 실제 상품 정보를 살펴보고 가입해 보세요.</p>
            </div>
            <BottomButton color="white" @click="handleBrowseProducts">상품 살펴보기</BottomButton>
          </div>
        </BaseCard>
      </section>
    </template>

    <!-- 안내 배너 -->
    <BaseCard color="blue">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">실제 돈은 사용되지 않아요</h2>
        <p class="text-caption text-muted">가상의 자산과 실제 상품 정보로 투자 감각을 익히는 연습 서비스예요.</p>
      </div>
    </BaseCard>

    <!-- 계좌 생성·상품 가입·해지 완료 토스트 -->
    <BaseToast
      v-model="isToastVisible"
      :title="toastContent.title"
      :description="toastContent.description"
      offset="header"
    />
  </div>
</template>
