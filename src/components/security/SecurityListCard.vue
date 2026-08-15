<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import {
  getSecurityCategoryPill,
  getSecurityTypeLabel,
} from "@/constants/security";
import {
  formatCurrency,
  formatRate,
  formatSignedCurrency,
} from "@/utils/format";

const props = defineProps({
  security: {
    type: Object,
    required: true,
  },
  quote: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["select"]);

const typeLabel = computed(() => getSecurityTypeLabel(props.security.type));
const categoryPill = computed(() =>
  getSecurityCategoryPill(props.security.type),
);

const showQuote = computed(() => props.security.kisSupported);

const matchScore = computed(() =>
  props.security.matchScore != null ? Math.round(props.security.matchScore) : null,
);

const priceLabel = computed(() =>
  props.quote && props.quote.price !== null
    ? formatCurrency(props.quote.price)
    : "—",
);

const changeLabel = computed(() => {
  if (!props.quote || props.quote.change === null) return "—";
  return `${formatSignedCurrency(props.quote.change)} (${formatRate(
    props.quote.changeRate,
  )})`;
});

const changeColorClass = computed(() => {
  const change = props.quote?.change;
  if (change === null || change === undefined) return "text-muted";
  if (change > 0) return "text-profit";
  if (change < 0) return "text-loss";
  return "text-muted";
});

function handleSelect() {
  emit("select", props.security);
}
</script>

<template>
  <article class="relative">
    <BaseCard color="white" elevation="flat">
      <div class="flex flex-col gap-2">
        <!-- 행 1: 종목명 + 카테고리 | 현재가 -->
        <div class="flex items-center gap-4">
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <h3 class="min-w-0 truncate text-h2 text-ink">{{ security.name }}</h3>
            <BasePill
              v-if="categoryPill"
              as="span"
              :label="categoryPill.label"
              :color="categoryPill.color"
              variant="filled"
            />
          </div>
          <p v-if="showQuote" class="shrink-0 text-body font-semibold text-ink tabular-nums">
            {{ priceLabel }}
          </p>
          <p v-else class="shrink-0 text-caption text-muted">실시간 시세 미지원</p>
        </div>

        <!-- 행 2: 티커 · 유형 · 매칭도 | 등락률 -->
        <div class="flex items-center gap-4">
          <p class="min-w-0 flex-1 text-caption text-muted tabular-nums">
            {{ security.ticker }} · {{ typeLabel }}<template v-if="matchScore !== null"> · <span class="text-ink font-semibold">매칭 {{ matchScore }}%</span></template>
          </p>
          <div class="flex shrink-0 items-center gap-2">
            <p
              v-if="showQuote"
              :class="[changeColorClass, 'text-caption tabular-nums']"
            >
              {{ changeLabel }}
            </p>
          </div>
        </div>
      </div>
    </BaseCard>
    <button
      type="button"
      class="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink"
      :aria-label="`${security.name} 상세 보기`"
      @click="handleSelect"
    />
  </article>
</template>
