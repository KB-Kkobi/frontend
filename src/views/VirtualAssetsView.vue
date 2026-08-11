<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/common/BaseCard.vue'
import BottomButton from '@/components/common/BottomButton.vue'
import { fetchPortfolio, fetchHoldings } from '@/api/trade'
import { formatCurrency, formatRate, formatSignedCurrency } from '@/utils/format'

// ── 라우트 ────────────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

// ── 반응형 상태 ───────────────────────────────────────────────────────────────
const hasJustStarted = computed(() => route.query.started === 'true')

const portfolio = ref(null)
const holdings = ref([])
const isLoading = ref(false)
const hasError = ref(false)

// ── computed ─────────────────────────────────────────────────────────────────
const totalAsset = computed(() => portfolio.value?.totalAsset ?? null)
const totalProfit = computed(() => portfolio.value?.totalProfit ?? null)
const totalProfitRate = computed(() => portfolio.value?.totalProfitRate ?? null)
const cashBalance = computed(() => portfolio.value?.cashBalance ?? null)

const profitColorClass = computed(() => {
  const rate = totalProfitRate.value
  if (rate === null) return 'text-muted'
  if (rate > 0) return 'text-profit'
  if (rate < 0) return 'text-loss'
  return 'text-muted'
})

// ── 함수 ─────────────────────────────────────────────────────────────────────
async function loadData() {
  isLoading.value = true
  hasError.value = false
  try {
    const [portfolioData, holdingsData] = await Promise.all([
      fetchPortfolio(),
      fetchHoldings(),
    ])
    portfolio.value = portfolioData
    holdings.value = Array.isArray(holdingsData?.holdings)
      ? holdingsData.holdings
      : Array.isArray(holdingsData)
        ? holdingsData
        : []
  } catch (err) {
    console.error('[VirtualAssetsView] 데이터 조회 실패', err)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

function handleStart() {
  router.push({ name: 'virtual-start' })
}

function handleViewProductHoldings() {
  router.push({ name: 'product-holdings' })
}

function handleHoldingTrade(holding) {
  if (!holding.securityId) return
  router.push({
    name: 'virtual-trade',
    params: { securityId: holding.securityId },
    query: { ticker: holding.ticker },
  })
}

function formatCurrentPrice(price) {
  if (price === null || price === undefined) return '--'
  return formatCurrency(price)
}

function holdingProfitRate(holding) {
  if (holding.profitRate !== null && holding.profitRate !== undefined) {
    return holding.profitRate
  }
  if (holding.currentPrice !== null && holding.avgPrice) {
    return ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100
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

// ── lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  loadData()
})

// keep-alive 재진입 시 보유자산 최신화
onActivated(() => {
  loadData()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <p class="text-caption text-muted">부담 없이 시작하는 나만의 투자 연습장이에요.</p>

    <!-- 시작 완료 알림 -->
    <BaseCard v-if="hasJustStarted" color="green">
      <div class="flex flex-col gap-2">
        <p class="text-caption font-semibold text-green">설정 완료</p>
        <h2 class="text-h2 text-ink">가상투자 계좌가 만들어졌어요</h2>
        <p class="text-caption text-muted">설정한 조건으로 자유롭게 투자를 연습해 보세요.</p>
      </div>
    </BaseCard>

    <!-- 로딩 중 -->
    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <p class="text-caption text-muted">자산 정보를 불러오는 중이에요...</p>
      </div>
    </BaseCard>

    <!-- 포트폴리오 요약 -->
    <BaseCard v-else color="blue">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-h2 text-ink">내 가상투자 계좌</h2>
          <span
            class="inline-flex items-center justify-center rounded-xl border border-blue bg-blue px-pill-x py-pill-y text-caption font-semibold text-white"
          >
            연습 계좌
          </span>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-caption text-muted">총 자산</p>
          <p class="text-amount text-ink tabular-nums">
            {{ totalAsset !== null ? formatCurrency(totalAsset) : '0원' }}
          </p>
        </div>
        <div class="flex justify-between gap-4 border-t border-line pt-4">
          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">투자 수익</span>
            <strong :class="['text-body tabular-nums', profitColorClass]">
              {{ totalProfit !== null ? formatSignedCurrency(totalProfit) : '+0원' }}
            </strong>
          </div>
          <div class="flex flex-col gap-2 text-right">
            <span class="text-caption text-muted">수익률</span>
            <strong :class="['text-body tabular-nums', profitColorClass]">
              {{ totalProfitRate !== null ? formatRate(totalProfitRate) : '+0.00%' }}
            </strong>
          </div>
        </div>
        <div v-if="cashBalance !== null" class="flex items-center justify-between border-t border-line pt-4">
          <span class="text-caption text-muted">현금 잔고</span>
          <span class="text-body text-ink tabular-nums">{{ formatCurrency(cashBalance) }}</span>
        </div>
      </div>
    </BaseCard>

    <!-- 보유 종목 목록 -->
    <div class="flex flex-col gap-4">
      <h2 class="text-h2 text-ink">보유 종목</h2>

      <!-- 에러 -->
      <BaseCard v-if="hasError" color="pink">
        <div class="flex flex-col gap-2">
          <p class="text-caption text-muted">종목 정보를 불러오지 못했어요.</p>
        </div>
      </BaseCard>

      <!-- 빈 상태 -->
      <BaseCard v-else-if="!isLoading && holdings.length === 0" color="white">
        <div class="flex flex-col gap-2">
          <p class="text-body text-muted tracking-tight">보유 중인 종목이 없어요</p>
          <p class="text-caption text-muted tracking-tight">상품 탭에서 종목을 찾아 투자해 보세요.</p>
        </div>
      </BaseCard>

      <!-- 보유 종목 카드 목록 -->
      <template v-else>
        <BaseCard
          v-for="holding in holdings"
          :key="holding.securityId ?? holding.ticker"
          color="white"
        >
          <div class="flex flex-col gap-4">
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-2">
                <span class="text-h2 text-ink tracking-tight">{{ holding.name ?? holding.ticker }}</span>
                <span class="text-caption text-muted tracking-tight">{{ holding.ticker }}</span>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="text-body text-ink tabular-nums">
                  {{ formatCurrentPrice(holding.currentPrice) }}
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
                  {{ holding.avgPrice !== null ? formatCurrency(holding.avgPrice) : '--' }}
                </span>
              </div>
              <div class="flex flex-1 flex-col gap-2">
                <span class="text-caption text-muted">평가 금액</span>
                <span class="text-body font-semibold tabular-nums">
                  {{ holding.evaluatedAmount !== null && holding.evaluatedAmount !== undefined
                    ? formatCurrency(holding.evaluatedAmount)
                    : (holding.currentPrice !== null && holding.quantity
                      ? formatCurrency(holding.currentPrice * holding.quantity)
                      : '--') }}
                </span>
              </div>
            </div>
            <BottomButton
              v-if="holding.securityId"
              color="pink"
              @click="handleHoldingTrade(holding)"
            >
              매수 / 매도
            </BottomButton>
          </div>
        </BaseCard>
      </template>
    </div>

    <!-- 가상투자 시작 유도 카드 (계좌 없을 때) -->
    <BaseCard v-if="!isLoading && !portfolio" color="white">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <p class="text-caption font-semibold text-yellow">처음이신가요?</p>
          <h2 class="text-h2 text-ink">나에게 맞는 조건으로 시작해요</h2>
          <p class="text-caption text-muted">
            초기 자산과 매월 투자할 금액을 정하면 가상 계좌를 준비해 드려요.
          </p>
        </div>
        <BottomButton color="yellow" @click="handleStart">가상투자 시작하기</BottomButton>
      </div>
    </BaseCard>

    <BaseCard color="pink">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">실제 돈은 사용되지 않아요</h2>
        <p class="text-caption text-muted">
          가상의 자산으로 상품을 사고팔며 투자 감각을 익힐 수 있어요.
        </p>
      </div>
    </BaseCard>

    <BottomButton color="white" @click="handleViewProductHoldings">
      내가 가입한 예적금 보기
    </BottomButton>
  </div>
</template>
