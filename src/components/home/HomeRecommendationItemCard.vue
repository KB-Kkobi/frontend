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
  formatInterestRate,
  formatRate,
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
  // 투자성향 매칭도(0~100). null이면 배지를 표시하지 않음
  matchScore: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["select"]);

const typeLabel = computed(() => getSecurityTypeLabel(props.security.type));
const categoryPill = computed(() =>
  getSecurityCategoryPill(props.security.type),
);
const matchScoreLabel = computed(() =>
  props.matchScore === null ? null : `매칭 ${formatInterestRate(props.matchScore)}`,
);

const showQuote = computed(() => props.security.kisSupported);

const priceLabel = computed(() =>
  props.quote && props.quote.price !== null
    ? formatCurrency(props.quote.price)
    : "—",
);

const changeRateLabel = computed(() => {
  if (!props.quote || props.quote.changeRate === null) return "—";
  return formatRate(props.quote.changeRate);
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
  <article class="relative w-40 shrink-0">
    <BaseCard color="white" elevation="flat">
      <div class="flex flex-col gap-2">
        <BasePill
          v-if="categoryPill"
          as="span"
          class="self-start"
          :label="categoryPill.label"
          :color="categoryPill.color"
          variant="filled"
        />

        <div class="flex flex-col gap-1">
          <h3 class="truncate text-body font-semibold text-ink">
            {{ security.name }}
          </h3>
          <p class="truncate text-caption text-muted">{{ typeLabel }}</p>
        </div>

        <template v-if="showQuote">
          <p class="text-body font-semibold text-ink tabular-nums">
            {{ priceLabel }}
          </p>
          <p :class="[changeColorClass, 'text-caption tabular-nums']">
            {{ changeRateLabel }}
          </p>
        </template>
        <p v-else class="text-caption text-muted">시세 미지원</p>

        <BasePill
          v-if="matchScoreLabel"
          as="span"
          class="self-start"
          :label="matchScoreLabel"
          color="lavender"
          variant="outline"
        />
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
