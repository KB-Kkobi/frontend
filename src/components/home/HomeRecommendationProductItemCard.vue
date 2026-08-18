<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import { getProductCategoryPill } from "@/constants/product";
import { formatInterestRate, formatNullableText } from "@/utils/format";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["select"]);

const categoryPill = computed(() => getProductCategoryPill(props.product.productType));

function handleSelect() {
  emit("select", props.product);
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
            {{ formatNullableText(product.productName) }}
          </h3>
          <p class="truncate text-caption text-muted">
            {{ formatNullableText(product.financialCompanyName) }}
          </p>
        </div>

        <p class="text-body font-semibold text-profit tabular-nums">
          연 {{ formatInterestRate(product.maximumInterestRate) }}
        </p>
        <p class="text-caption text-muted">최고 우대 금리</p>
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
