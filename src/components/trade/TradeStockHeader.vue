<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import { formatCurrency, formatRate } from '@/utils/format.js'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    default: '',
  },
  currentPrice: {
    type: Number,
    default: null,
  },
  changeRate: {
    type: Number,
    default: null,
  },
})

const formattedPrice = computed(() => {
  if (props.currentPrice === null) return '--'
  return `현재가 ${formatCurrency(props.currentPrice)}`
})

const formattedRate = computed(() => {
  if (props.changeRate === null) return '--'
  return formatRate(props.changeRate)
})

const rateColorClass = computed(() => {
  if (props.changeRate === null) return 'text-muted'
  if (props.changeRate > 0) return 'text-profit'
  if (props.changeRate < 0) return 'text-loss'
  return 'text-muted'
})
</script>

<template>
  <BaseCard elevation="highlight">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-2">
        <span class="text-h2 text-ink tracking-tight">{{ props.name }}</span>
        <span v-if="props.code" class="text-caption text-muted">{{ props.code }}</span>
        <span class="text-caption text-muted tabular-nums">{{ formattedPrice }}</span>
      </div>
      <span :class="['text-body font-semibold tabular-nums', rateColorClass]">
        {{ formattedRate }}
      </span>
    </div>
  </BaseCard>
</template>
