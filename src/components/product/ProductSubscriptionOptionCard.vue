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
  elevation: {
    type: String,
    default: "default",
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
    <BaseCard :color="isSelected ? 'pink' : 'white'" :elevation="elevation">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-2">
          <strong class="text-h2 text-ink tabular-nums">
            {{ savingTermLabel }}
          </strong>
          <p class="text-caption text-muted">
            기본 {{ formatInterestRate(option.interestRate) }} · 최고
            {{ formatInterestRate(option.maximumInterestRate) }}
          </p>
          <p v-if="hasReserveType" class="text-caption text-muted">
            {{ formatNullableText(option.reserveTypeName) }}
          </p>
        </div>
        <BasePill
          :label="isSelected ? '선택됨' : '선택'"
          color="pink"
          :variant="isSelected ? 'filled' : 'ghost'"
        />
      </div>
    </BaseCard>
  </div>
</template>
