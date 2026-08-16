<script setup>
import BaseCard from '@/components/common/BaseCard.vue'
import AssetCompositionRow from '@/components/virtual/AssetCompositionRow.vue'

defineProps({
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
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">자산 구성</h2>
        <p class="text-caption text-muted">서버에 저장된 현금과 보유 자산을 기준으로 계산했어요.</p>
      </div>
      <dl class="flex flex-col gap-4">
        <AssetCompositionRow label="현금" :amount="cashBalance" :ratio="cashRatio" bar-color="blue" />
        <AssetCompositionRow
          class="border-t border-line-soft pt-4"
          label="주식"
          :amount="stockAsset"
          :ratio="stockRatio"
          bar-color="lavender"
        />
        <AssetCompositionRow
          class="border-t border-line-soft pt-4"
          label="예·적금"
          :amount="savingsAsset"
          :ratio="savingsRatio"
          bar-color="green"
        />
      </dl>
    </div>
  </BaseCard>
</template>
