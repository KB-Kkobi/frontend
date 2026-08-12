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
        <AssetCompositionRow
          label="사용 가능한 현금"
          :amount="cashBalance"
          :ratio="cashRatio"
        />
        <AssetCompositionRow
          class="border-t border-line pt-4"
          label="주식 자산"
          :amount="stockAsset"
          :ratio="stockRatio"
        />
        <AssetCompositionRow
          class="border-t border-line pt-4"
          label="예금·적금 자산"
          :amount="savingsAsset"
          :ratio="savingsRatio"
          amount-class="text-profit"
        />
      </dl>
    </div>
  </BaseCard>
</template>
