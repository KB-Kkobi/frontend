<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'

const props = defineProps({
  currentRatio: {
    type: Number,
    default: null,
  },
  afterRatio: {
    type: Number,
    default: null,
  },
  recommendedRatio: {
    type: Number,
    default: null,
  },
  show: {
    type: Boolean,
    default: true,
  },
})

const hasData = computed(
  () =>
    props.show &&
    props.currentRatio !== null &&
    props.afterRatio !== null &&
    props.recommendedRatio !== null,
)

const ratioChangeText = computed(() => {
  if (!hasData.value) return ''
  return `${props.currentRatio}% → ${props.afterRatio}%`
})

const barWidthStyle = computed(() => {
  if (!hasData.value) return { width: '0%' }
  return { width: `${Math.min(props.afterRatio, 100)}%` }
})

const recommendedLineStyle = computed(() => {
  if (!hasData.value) return { left: '0%' }
  return { left: `${Math.min(props.recommendedRatio, 100)}%` }
})

const isOverRecommended = computed(
  () => hasData.value && props.afterRatio > props.recommendedRatio,
)
</script>

<template>
  <div v-if="hasData" class="flex flex-col gap-4">
    <!-- 헤더 -->
    <div class="flex flex-col gap-2">
      <span class="text-h2 text-ink tracking-tight">주문하면 이렇게 바뀌어요</span>
      <span class="text-caption text-muted tracking-tight">검은 선이 내 성향의 권장 비중이에요</span>
    </div>

    <!-- 비중 행 -->
    <div class="flex items-center justify-between">
      <span class="text-body text-muted tracking-tight">주식 · ETF 비중</span>
      <span class="text-body font-semibold text-profit tabular-nums">{{ ratioChangeText }}</span>
    </div>

    <!-- 프로그레스바 -->
    <div class="relative h-4 w-full overflow-visible rounded-full bg-surface">
      <!-- 채워진 바 -->
      <div
        class="absolute left-0 top-0 h-full rounded-full bg-yellow transition-all"
        :style="barWidthStyle"
      />
      <!-- 권장 비중 세로선 -->
      <div
        class="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-ink"
        :style="recommendedLineStyle"
      />
    </div>

    <!-- 경고 박스 (afterRatio > recommendedRatio 시에만) -->
    <BaseCard v-if="isOverRecommended" color="yellow">
      <p class="text-caption text-ink tracking-tight">
        권장 비중({{ recommendedRatio }}%)보다 높아져요. 그래도 괜찮다면 진행하세요.
      </p>
    </BaseCard>
  </div>
</template>
