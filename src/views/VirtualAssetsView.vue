<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '@/components/common/BaseCard.vue'
import BottomButton from '@/components/common/BottomButton.vue'

const route = useRoute()
const router = useRouter()

const hasJustStarted = computed(() => route.query.started === 'true')

function handleStart() {
  router.push({ name: 'virtual-start' })
}

function handleViewProductHoldings() {
  router.push({ name: 'product-holdings' })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <p class="text-caption text-muted">부담 없이 시작하는 나만의 투자 연습장이에요.</p>

    <BaseCard v-if="hasJustStarted" color="green">
      <div class="flex flex-col gap-2">
        <p class="text-caption font-semibold text-green">설정 완료</p>
        <h2 class="text-h2 text-ink">가상투자 계좌가 만들어졌어요</h2>
        <p class="text-caption text-muted">설정한 조건으로 자유롭게 투자를 연습해 보세요.</p>
      </div>
    </BaseCard>

    <BaseCard color="blue">
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
          <p class="text-amount text-ink tabular-nums">0원</p>
        </div>
        <div class="flex justify-between gap-4 border-t border-line pt-4">
          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">투자 수익</span>
            <strong class="text-body text-profit tabular-nums">+0원</strong>
          </div>
          <div class="flex flex-col gap-2 text-right">
            <span class="text-caption text-muted">수익률</span>
            <strong class="text-body text-profit tabular-nums">+0.00%</strong>
          </div>
        </div>
      </div>
    </BaseCard>

    <BaseCard color="white">
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
