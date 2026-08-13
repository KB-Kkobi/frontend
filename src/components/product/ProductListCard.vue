<script setup>
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import {
  formatCurrency,
  formatInterestRate,
  formatNullableText,
} from "@/utils/format";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "catalog"].includes(value),
  },
});

const emit = defineEmits(["select"]);

function handleSelect() {
  emit("select", props.product);
}
</script>

<template>
  <article
    role="button"
    tabindex="0"
    :aria-label="`${formatNullableText(product.productName)} 상세 보기`"
    @click="handleSelect"
    @keydown.enter="handleSelect"
    @keydown.space.prevent="handleSelect"
  >
    <BaseCard color="white" elevation="flat">
      <div v-if="variant === 'catalog'" class="flex items-center gap-4">
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <p class="text-caption text-muted">
            {{ formatNullableText(product.financialCompanyName) }}
          </p>
          <h3 class="text-h2 text-navy">
            {{ formatNullableText(product.productName) }}
          </h3>
          <div class="flex items-center text-caption text-muted tabular-nums">
            <span class="text-caption text-muted tabular-nums">
              {{ product.savingTerm ? `${product.savingTerm}개월` : "-" }}
            </span>
          </div>
        </div>

        <dl class="flex shrink-0">
          <div class="flex flex-col items-center gap-2 pr-4 text-center">
            <dt class="text-caption text-muted">기본금리</dt>
            <dd class="text-h2 text-profit tabular-nums">
              연 {{ formatInterestRate(product.interestRate) }}
            </dd>
          </div>
          <div class="flex flex-col items-center gap-2 border-l border-line pl-4 text-center">
            <dt class="text-caption text-muted">최고금리</dt>
            <dd class="text-h2 text-profit tabular-nums">
              연 {{ formatInterestRate(product.maximumInterestRate) }}
            </dd>
          </div>
        </dl>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <p class="text-caption text-muted">
            {{ formatNullableText(product.financialCompanyName) }}
          </p>
          <h3 class="text-h2 text-ink">
            {{ formatNullableText(product.productName) }}
          </h3>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">가입 기간</span>
            <strong class="text-body text-ink tabular-nums">
              {{ product.savingTerm ? `${product.savingTerm}개월` : "—" }}
            </strong>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">최고 우대 금리</span>
            <strong class="text-h2 text-profit tabular-nums">
              {{ formatInterestRate(product.maximumInterestRate) }}
            </strong>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">기본 금리</span>
            <strong class="text-body text-profit tabular-nums">
              {{ formatInterestRate(product.interestRate) }}
            </strong>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">최고 가입 한도</span>
            <strong class="text-body text-ink tabular-nums">
              {{ formatCurrency(product.maxLimit) }}
            </strong>
          </div>
        </div>

        <p v-if="product.reserveTypeName" class="text-caption text-muted">
          {{ product.reserveTypeName }}
        </p>
      </div>
    </BaseCard>
  </article>
</template>
