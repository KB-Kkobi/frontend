<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import {
  PRODUCT_TYPES,
  getProductCategoryPill,
  normalizeProductType,
} from "@/constants/product";
import { formatInterestRate, formatNullableText } from "@/utils/format";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["select"]);

const HOME_CATEGORY_COLORS = {
  [PRODUCT_TYPES.DEPOSIT]: "green",
  [PRODUCT_TYPES.SAVING]: "green",
};

const categoryPill = computed(() => {
  const category = getProductCategoryPill(props.product.productType);
  const categoryColor = HOME_CATEGORY_COLORS[normalizeProductType(props.product.productType)];

  return category && categoryColor ? { ...category, color: categoryColor } : category;
});

function handleSelect() {
  emit("select", props.product);
}
</script>

<template>
  <article class="relative flex w-40 shrink-0 snap-start self-stretch">
    <BaseCard class="flex w-full" color="white" elevation="flat">
      <div class="flex h-full w-full flex-col gap-2">
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
            <h3 class="truncate text-h2 font-semibold text-ink">
              {{ formatNullableText(product.productName) }}
            </h3>
            <p class="truncate text-caption text-muted">
              {{ formatNullableText(product.financialCompanyName) }}
            </p>
          </div>
        </div>

        <div class="border-t border-line-soft" aria-hidden="true" />

        <div class="flex flex-col gap-2">
          <p class="text-h2 font-semibold text-profit tabular-nums">
            연 {{ formatInterestRate(product.maximumInterestRate) }}
          </p>
          <p class="text-caption text-muted">최고 우대 금리</p>
        </div>

      </div>
    </BaseCard>
    <button
      type="button"
      class="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink"
      :aria-label="`${formatNullableText(product.productName)} 상세 보기`"
      @click="handleSelect"
    />
  </article>
</template>
