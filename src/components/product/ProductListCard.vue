<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import ProductBankLogo from "@/components/product/ProductBankLogo.vue";
import {
  formatBankName,
  formatCurrency,
  formatInterestRate,
  formatNullableText,
} from "@/utils/format";

// 카드에 노출할 상품 특징 태그는 최대 이 개수까지만 표시한다.
// 태그 줄이 두 줄로 넘어가면 카드 높이가 들쭉날쭉해지므로 한 줄에
// 들어가는 개수로 제한한다.
const MAX_PRODUCT_TAGS = 2;

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

// 실제 API 데이터에 근거한 태그만 노출한다(값이 없으면 생성하지 않음).
// joinWay(가입 방법)에 "영업점"이 없으면 온라인 채널만 지원한다는 뜻이므로
// "비대면 가입" 태그로 보여준다.
const productTags = computed(() => {
  const tags = [];
  if (props.product.savingTerm) tags.push(`${props.product.savingTerm}개월`);
  if (props.product.reserveTypeName) tags.push(props.product.reserveTypeName);

  const joinWay = props.product.joinWay ?? props.product.joinway;
  if (joinWay && !String(joinWay).includes("영업점")) tags.push("비대면 가입");

  return tags.slice(0, MAX_PRODUCT_TAGS);
});

function handleSelect() {
  emit("select", props.product);
}
</script>

<template>
  <article class="relative">
    <BaseCard color="white" elevation="flat">
      <div v-if="variant === 'catalog'" class="flex items-center gap-4">
        <ProductBankLogo :name="product.financialCompanyName" />

        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <p class="truncate text-caption text-muted">
            {{ formatBankName(product.financialCompanyName) }}
          </p>
          <h3 class="line-clamp-2 break-keep text-h2 text-ink">
            {{ formatNullableText(product.productName) }}
          </h3>
          <div v-if="productTags.length" class="flex flex-wrap gap-2">
            <BasePill
              v-for="tag in productTags"
              :key="tag"
              :label="tag"
              variant="ghost"
            />
          </div>
        </div>

        <div class="flex shrink-0 flex-col items-end gap-2">
          <p class="whitespace-nowrap text-body font-semibold text-profit tabular-nums">
            최고 {{ formatInterestRate(product.maximumInterestRate) }}
          </p>
          <p class="whitespace-nowrap text-caption text-muted tabular-nums">
            기본 {{ formatInterestRate(product.interestRate) }}
          </p>
        </div>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div class="flex items-center gap-4">
          <ProductBankLogo :name="product.financialCompanyName" />
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <p class="text-caption text-muted">
              {{ formatNullableText(product.financialCompanyName) }}
            </p>
            <h3 class="text-h2 text-ink">
              {{ formatNullableText(product.productName) }}
            </h3>
          </div>
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
    <button
      type="button"
      class="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink"
      :aria-label="`${formatNullableText(product.productName)} 상세 보기`"
      @click="handleSelect"
    />
  </article>
</template>
