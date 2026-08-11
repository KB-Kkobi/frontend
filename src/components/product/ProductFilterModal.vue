<script setup>
import { computed, ref, watch } from "vue";
import BasePill from "@/components/common/BasePill.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import {
  PREFERENTIAL_CONDITION_OPTIONS,
  PRODUCT_TYPES,
  RESERVE_TYPE_OPTIONS,
  SAVING_TERM_OPTIONS,
  normalizeProductType,
} from "@/constants/product";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  productType: { type: String, required: true },
  savingTerms: { type: Array, default: () => [] },
  reserveTypes: { type: Array, default: () => [] },
  preferentialConditions: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "apply"]);

const draftSavingTerms = ref([]);
const draftReserveTypes = ref([]);
const draftPreferentialConditions = ref([]);

const isSaving = computed(
  () => normalizeProductType(props.productType) === PRODUCT_TYPES.SAVING,
);
const selectableReserveTypes = computed(() =>
  RESERVE_TYPE_OPTIONS.filter((option) => option.value),
);

function toggleValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function handleToggleSavingTerm(savingTerm) {
  draftSavingTerms.value = toggleValue(draftSavingTerms.value, savingTerm);
}

function handleToggleReserveType(reserveType) {
  draftReserveTypes.value = toggleValue(draftReserveTypes.value, reserveType);
}

function handleTogglePreferentialCondition(conditionType) {
  draftPreferentialConditions.value = toggleValue(
    draftPreferentialConditions.value,
    conditionType,
  );
}

function handleReset() {
  draftSavingTerms.value = [];
  draftReserveTypes.value = [];
  draftPreferentialConditions.value = [];
}

function handleClose() {
  emit("update:modelValue", false);
}

function handleApply() {
  emit("apply", {
    savingTerms: [...draftSavingTerms.value],
    reserveTypes: isSaving.value ? [...draftReserveTypes.value] : [],
    preferentialConditions: [...draftPreferentialConditions.value],
  });
  handleClose();
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    draftSavingTerms.value = [...props.savingTerms];
    draftReserveTypes.value = [...props.reserveTypes];
    draftPreferentialConditions.value = [...props.preferentialConditions];
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      @click.self="handleClose"
    >
      <section
        class="flex max-h-screen w-full max-w-[430px] flex-col gap-6 overflow-y-auto rounded-t-3xl bg-base pt-8 px-4 pb-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-filter-title"
      >
        <header class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-2">
            <h2 id="product-filter-title" class="text-h1 text-ink">필터</h2>
            <p class="text-caption text-muted">여러 조건을 함께 선택할 수 있어요.</p>
          </div>
          <button
            type="button"
            class="text-h1 text-muted"
            aria-label="필터 닫기"
            @click="handleClose"
          >
            ×
          </button>
        </header>

        <fieldset class="flex flex-col gap-4">
          <legend class="text-h2 text-ink">가입 기간</legend>
          <div class="grid grid-cols-3 gap-2">
            <BasePill
              v-for="savingTerm in SAVING_TERM_OPTIONS"
              :key="savingTerm"
              as="button"
              type="button"
              :label="`${savingTerm}개월`"
              color="pink"
              full-width
              :variant="draftSavingTerms.includes(savingTerm) ? 'filled' : 'ghost'"
              :aria-pressed="draftSavingTerms.includes(savingTerm)"
              @click="handleToggleSavingTerm(savingTerm)"
            />
          </div>
        </fieldset>

        <fieldset v-if="isSaving" class="flex flex-col gap-4">
          <legend class="text-h2 text-ink">적립 방식</legend>
          <div class="grid grid-cols-2 gap-2">
            <BasePill
              v-for="reserveType in selectableReserveTypes"
              :key="reserveType.value"
              as="button"
              type="button"
              :label="reserveType.label"
              color="blue"
              full-width
              :variant="draftReserveTypes.includes(reserveType.value) ? 'filled' : 'ghost'"
              :aria-pressed="draftReserveTypes.includes(reserveType.value)"
              @click="handleToggleReserveType(reserveType.value)"
            />
          </div>
        </fieldset>

        <fieldset class="flex flex-col gap-4">
          <legend class="text-h2 text-ink">우대조건</legend>
          <div class="grid grid-cols-2 gap-2">
            <BasePill
              v-for="condition in PREFERENTIAL_CONDITION_OPTIONS"
              :key="condition.value"
              as="button"
              type="button"
              :label="condition.label"
              color="yellow"
              full-width
              :variant="draftPreferentialConditions.includes(condition.value) ? 'filled' : 'ghost'"
              :aria-pressed="draftPreferentialConditions.includes(condition.value)"
              @click="handleTogglePreferentialCondition(condition.value)"
            />
          </div>
        </fieldset>

        <div class="flex gap-2">
          <BottomButton color="white" @click="handleReset">초기화</BottomButton>
          <BottomButton @click="handleApply">적용</BottomButton>
        </div>
      </section>
    </div>
  </Teleport>
</template>
