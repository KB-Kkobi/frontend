<script setup>
import { computed } from 'vue';
import BaseBadge from '@/components/common/BaseBadge.vue';
import BaseCard from '@/components/common/BaseCard.vue';
import GameEventBanner from '@/components/game/GameEventBanner.vue';
import MarketLineChart from '@/components/game/MarketLineChart.vue';
import { formatCurrency, formatRate } from '@/utils/format';

const props = defineProps({
  currentTick: {
    type: Object,
    default: null,
  },
  prices: {
    type: Array,
    default: () => [],
  },
  totalTicks: {
    type: Number,
    default: 0,
  },
  priceMin: {
    type: Number,
    default: 0,
  },
  priceMax: {
    type: Number,
    default: 0,
  },
  bannerEvent: {
    type: Object,
    default: null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  showBaseline: {
    type: Boolean,
    default: false,
  },
});

const changeColorClass = computed(() => {
  const changeRate = props.currentTick?.changeRate ?? 0;
  if (changeRate > 0) return 'text-profit';
  if (changeRate < 0) return 'text-loss';
  return 'text-muted';
});
</script>

<template>
  <BaseCard color="white" elevation="highlight" density="tight">
    <div class="flex flex-col gap-4">
      <div data-tutorial-target="market-price-info" class="flex flex-col gap-4">
        <div data-tutorial-target="market-index" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <h2 class="text-h1 text-ink">시장종합지수</h2>
              <BaseBadge color="pink">모의투자</BaseBadge>
            </div>

            <div class="flex items-end gap-2">
              <p :class="[changeColorClass, 'text-amount tabular-nums']">
                {{ formatRate(currentTick?.changeRate) }}
              </p>
              <p class="text-caption text-muted">
                시작 대비 · 경과 {{ currentTick?.month }}개월차
              </p>
            </div>
          </div>

          <div class="w-full text-pink">
            <MarketLineChart
              :prices="prices"
              :total-ticks="totalTicks"
              :price-min="priceMin"
              :price-max="priceMax"
              :compact="compact"
              :show-baseline="showBaseline"
            />
          </div>
        </div>

        <div data-tutorial-target="current-price" class="flex items-center justify-between">
          <span class="text-caption text-muted">현재가</span>
          <strong class="text-h2 text-ink tabular-nums">
            {{ formatCurrency(currentTick?.price) }}
          </strong>
        </div>
      </div>

      <GameEventBanner :event="bannerEvent" />
    </div>
  </BaseCard>
</template>
