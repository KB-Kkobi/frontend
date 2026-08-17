<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import AssetCompositionRow from '@/components/virtual/AssetCompositionRow.vue'

const props = defineProps({
  cashBalance: {
    type: Number,
    default: null,
  },
  cashRatio: {
    type: Number,
    required: true,
  },
  stockAsset: {
    type: Number,
    default: null,
  },
  stockRatio: {
    type: Number,
    required: true,
  },
  savingsAsset: {
    type: Number,
    default: null,
  },
  savingsRatio: {
    type: Number,
    required: true,
  },
})

function normalizeRatio(value) {
  const ratio = Number(value)
  if (!Number.isFinite(ratio)) return 0
  return Math.min(100, Math.max(0, ratio))
}

const assetSegments = computed(() => [
  {
    key: 'cash',
    label: '현금',
    amount: props.cashBalance,
    ratio: normalizeRatio(props.cashRatio),
    barColor: 'lavender',
    barClass: 'bg-lavender',
  },
  {
    key: 'stock',
    label: '주식',
    amount: props.stockAsset,
    ratio: normalizeRatio(props.stockRatio),
    barColor: 'pink',
    barClass: 'bg-pink',
  },
  {
    key: 'savings',
    label: '예·적금',
    amount: props.savingsAsset,
    ratio: normalizeRatio(props.savingsRatio),
    barColor: 'green',
    barClass: 'bg-green',
  },
])

const assetCompositionLabel = computed(() =>
  assetSegments.value
    .map((segment) => `${segment.label} ${segment.ratio.toFixed(1)}%`)
    .join(', '),
)
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <h2 class="text-h2 text-ink">자산 구성</h2>

      <div
        class="flex h-2 overflow-hidden rounded-full bg-segment"
        role="img"
        :aria-label="assetCompositionLabel"
      >
        <span
          v-for="segment in assetSegments"
          v-show="segment.ratio > 0"
          :key="segment.key"
          :class="[segment.barClass, 'h-full shrink-0']"
          :style="{ width: `${segment.ratio}%` }"
        ></span>
      </div>

      <dl class="flex flex-col gap-2">
        <AssetCompositionRow
          v-for="segment in assetSegments"
          :key="segment.key"
          :label="segment.label"
          :amount="segment.amount"
          :ratio="segment.ratio"
          :bar-color="segment.barColor"
        />
      </dl>
    </div>
  </BaseCard>
</template>
