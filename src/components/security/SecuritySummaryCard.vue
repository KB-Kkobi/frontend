<script setup>
import { ref, computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import PriceChart from "@/components/security/PriceChart.vue";
import { CHART_PERIODS } from "@/constants/chart";
import { getSecurityCategoryPill } from "@/constants/security";
import {
  formatCurrency,
  formatSignedCurrency,
  formatRate,
} from "@/utils/format";
import { isMarketOpen } from "@/utils/market";

const props = defineProps({
  code: { type: String, default: "005930" },
  name: { type: String, default: "삼성전자" },
  market: { type: String, default: "KOSPI" },
  type: { type: String, default: null },
  kisSupported: { type: Boolean, default: true },
  price: { type: Number, default: null },
  change: { type: Number, default: null },
  changeRate: { type: Number, default: null },
});

const categoryPill = computed(() => getSecurityCategoryPill(props.type));

const activePeriod = ref(CHART_PERIODS[0].key);

const chartSupported = computed(() => props.kisSupported && !!props.code);

const marketOpen = computed(() => {
  if (!props.kisSupported) return null;
  return isMarketOpen(props.market);
});

const changeColorClass = computed(() => {
  if (props.change === null || props.change === undefined) return "text-muted";
  if (props.change > 0) return "text-profit";
  if (props.change < 0) return "text-loss";
  return "text-muted";
});

function handlePeriodSelect(key) {
  activePeriod.value = key;
}
</script>

<template>
  <BaseCard elevation="highlight">
    <div class="flex flex-col gap-4">
      <!-- 헤더: 종목명 · 시장 · 코드 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <h2 class="min-w-0 flex-1 truncate text-h2 text-ink">{{ name }}</h2>
          <BasePill
            v-if="categoryPill"
            as="span"
            :label="categoryPill.label"
            :color="categoryPill.color"
            variant="filled"
          />
        </div>
        <span class="text-caption text-muted tabular-nums">
          <template v-if="market">{{ market }} · </template>{{ code }}
        </span>
      </div>

      <!-- 현재가 · 등락 -->
      <div v-if="kisSupported" class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <p class="text-amount text-ink tabular-nums">
            {{ formatCurrency(price) }}
          </p>
          <BasePill
            v-if="marketOpen === false"
            as="span"
            label="장 종료"
            color="yellow"
            variant="ghost"
          />
        </div>
        <p :class="[changeColorClass, 'text-body font-semibold tabular-nums']">
          {{ formatSignedCurrency(change) }} ({{ formatRate(changeRate) }})
        </p>
      </div>
      <p v-else class="text-caption text-muted">실시간 시세 미지원</p>

      <!-- 캔들스틱 차트 -->
      <template v-if="chartSupported">
        <PriceChart :code="code" :period="activePeriod" />

        <!-- 기간 선택 -->
        <div class="flex justify-end gap-2">
          <button
            v-for="opt in CHART_PERIODS"
            :key="opt.key"
            type="button"
            :class="[
              'py-3 px-4 text-caption',
              opt.key === activePeriod
                ? 'text-pink font-semibold'
                : 'text-muted',
            ]"
            @click="handlePeriodSelect(opt.key)"
          >
            {{ opt.label }}
          </button>
        </div>
      </template>
    </div>
  </BaseCard>
</template>
