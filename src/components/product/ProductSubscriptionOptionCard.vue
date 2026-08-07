<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import { formatInterestRate, formatNullableText } from "@/utils/format";

const props = defineProps({
  option: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const savingTermLabel = computed(() => {
  const savingTerm = Number(props.option.savingTerm);
  return Number.isFinite(savingTerm) ? `${savingTerm}개월` : "—";
});

const hasReserveType = computed(
  () =>
    props.option.reserveType !== "NONE" &&
    Boolean(props.option.reserveTypeName),
);

function handleSelect() {
  emit("select", props.option);
}
</script>

<template>
  <div
    role="radio"
    tabindex="0"
    :aria-checked="isSelected"
    @click="handleSelect"
    @keydown.enter.prevent="handleSelect"
    @keydown.space.prevent="handleSelect"
  >
    <BaseCard :color="isSelected ? 'pink' : 'white'">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">가입 기간</span>
            <strong class="text-h2 text-ink tabular-nums">
              {{ savingTermLabel }}
            </strong>
          </div>
          <BasePill
            :label="isSelected ? '선택됨' : '선택'"
            color="pink"
            :variant="isSelected ? 'filled' : 'ghost'"
          />
        </div>

        <dl class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <dt class="text-caption text-muted">기본 금리</dt>
            <dd class="text-h2 text-profit tabular-nums">
              {{ formatInterestRate(option.interestRate) }}
            </dd>
          </div>
          <div class="flex flex-col gap-2">
            <dt class="text-caption text-muted">최고 우대 금리</dt>
            <dd class="text-h2 text-profit tabular-nums">
              {{ formatInterestRate(option.maximumInterestRate) }}
            </dd>
          </div>
          <div class="flex flex-col gap-2">
            <dt class="text-caption text-muted">금리 유형</dt>
            <dd class="text-body text-ink">
              {{ formatNullableText(option.interestRateTypeName) }}
            </dd>
          </div>
          <div v-if="hasReserveType" class="flex flex-col gap-2">
            <dt class="text-caption text-muted">적립 유형</dt>
            <dd class="text-body text-ink">
              {{ option.reserveTypeName }}
            </dd>
          </div>
        </dl>
      </div>
    </BaseCard>
  </div>
</template>
