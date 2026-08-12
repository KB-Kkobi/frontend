<script setup>
import { computed, onActivated, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/common/BaseCard.vue'
import BottomButton from '@/components/common/BottomButton.vue'
import AssetCompositionCard from '@/components/virtual/AssetCompositionCard.vue'
import ProductHoldingCard from '@/components/product/ProductHoldingCard.vue'
import { formatCurrency, formatRate, formatSignedCurrency } from '@/utils/format'
import { useVirtualAssets } from '@/composables/useVirtualAssets'

const route = useRoute()
const router = useRouter()

const { account, stockHoldings, productHoldings, isLoading, isAccountMissing, errorMessage, loadAssets } = useVirtualAssets()

const hasJustStarted = computed(() => route.query.started === 'true')
const hasJustSubscribed = computed(() => route.query.subscribed === 'true')
const hasJustTerminated = computed(() => route.query.terminated === 'true')

const profitColorClass = computed(() => {
  const profit = Number(account.value?.totalProfit)
  if (isNaN(profit)) return 'text-muted'
  if (profit > 0) return 'text-profit'
  if (profit < 0) return 'text-loss'
  return 'text-muted'
})

function handleStart() {
  router.push({ name: 'virtual-start' })
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

onMounted(loadAssets)
onActivated(loadAssets)
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
    <BaseCard v-else-if="errorMessage" color="pink">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">자산 현황을 확인할 수 없어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadAssets">다시 시도하기</BottomButton>
      </div>
    </BaseCard>

    <!-- 계좌 없을 때 -->
    <template v-else-if="isAccountMissing">
      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <p class="text-caption font-semibold text-yellow">처음이신가요?</p>
            <h2 class="text-h2 text-ink">가상투자 계좌를 먼저 만들어 주세요</h2>
            <p class="text-caption text-muted">초기 자산과 매월 투자할 금액을 정하면 실제 데이터가 저장된 연습 계좌를 준비해 드려요.</p>
          </div>
          <BottomButton color="yellow" @click="handleStart">가상투자 시작하기</BottomButton>
        </div>
      </BaseCard>
    </template>

    <!-- 계좌 있을 때 -->
    <template v-else-if="account">
      <!-- 가입/해지 완료 알림 -->
      <BaseCard v-if="hasJustStarted" color="green">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">가상투자 계좌가 만들어졌어요</h2>
          <p class="text-caption text-muted">입력한 초기 자산이 계좌에 반영됐습니다.</p>
        </div>
      </BaseCard>
      <BaseCard v-if="hasJustSubscribed" color="green">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">상품 가입이 완료됐어요</h2>
          <p class="text-caption text-muted">사용 가능한 현금과 보유 예금·적금 목록을 서버에서 다시 불러왔습니다.</p>
        </div>
      </BaseCard>
      <BaseCard v-if="hasJustTerminated" color="green">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">상품 해지가 완료됐어요</h2>
          <p class="text-caption text-muted">반환 금액과 변경된 자산 비중을 서버에서 다시 불러왔습니다.</p>
        </div>
      </BaseCard>

      <!-- 계좌 요약 -->
      <BaseCard color="blue">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-h2 text-ink">내 가상투자 계좌</h2>
            <span class="rounded-xl bg-blue px-pill-x py-pill-y text-caption font-semibold text-white">연습 계좌</span>
          </div>
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
        <BaseCard v-if="stockHoldings.length === 0" color="white">
          <div class="flex flex-col gap-2">
            <p class="text-body text-muted tracking-tight">보유 중인 종목이 없어요</p>
            <p class="text-caption text-muted tracking-tight">상품 탭에서 종목을 찾아 투자해 보세요.</p>
          </div>
        </BaseCard>
        <BaseCard
          v-for="holding in stockHoldings"
          :key="holding.securityId ?? holding.ticker"
          color="white"
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
    <BaseCard color="pink">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">실제 돈은 사용되지 않아요</h2>
        <p class="text-caption text-muted">가상의 자산과 실제 상품 정보로 투자 감각을 익히는 연습 서비스예요.</p>
      </div>
    </BaseCard>
  </div>
</template>
