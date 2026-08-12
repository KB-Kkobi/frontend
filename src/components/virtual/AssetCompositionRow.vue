<script setup>
import { formatCurrency } from '@/utils/format'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: null,
  },
  ratio: {
    type: Number,
    required: true,
  },
  amountClass: {
    type: String,
    default: 'text-ink',
  },
})
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <dt class="text-body text-muted">{{ props.label }}</dt>
    <dd class="flex flex-col gap-2 text-right">
      <strong :class="['text-body tabular-nums', props.amountClass]">{{ formatCurrency(props.amount) }}</strong>
      <span class="text-caption text-muted tabular-nums">{{ props.ratio.toFixed(1) }}%</span>
    </dd>
  </div>
</template>
