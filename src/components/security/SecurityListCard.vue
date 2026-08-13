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
      <div class="flex items-start justify-between gap-4">
        <div class="flex min-w-0 flex-col gap-2">
          <div class="flex items-center gap-2">
            <h3 class="min-w-0 truncate text-h2 text-ink">{{ security.name }}</h3>
            <BasePill
              v-if="categoryPill"
              as="span"
              :label="categoryPill.label"
              :color="categoryPill.color"
              variant="filled"
            />
          </div>
          <p class="text-caption text-muted tabular-nums">
            {{ security.ticker }} · {{ typeLabel }}
          </p>
        </div>

        <div class="flex shrink-0 flex-col items-end gap-2">
          <template v-if="showQuote">
            <p class="text-body font-semibold text-ink tabular-nums">
              {{ priceLabel }}
            </p>
            <p :class="[changeColorClass, 'text-caption tabular-nums']">
              {{ changeLabel }}
            </p>
          </template>
          <p v-else class="text-caption text-muted">실시간 시세 미지원</p>
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
