<script setup>
import { computed, ref } from "vue";
import { formatAdditionalRate } from "@/utils/format";
import {
  getConditionLabel,
  groupPreferentialConditions,
  hasVisibleAdditionalRate,
} from "@/utils/preferentialConditions";

const props = defineProps({
  conditions: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

const conditionUnits = computed(() => groupPreferentialConditions(props.conditions));

// 그룹의 공통 안내(GROUP_NOTICE) 문구. 상품 상세 카드와 동일하게 "우대조건"
// 제목 옆 정보 아이콘을 눌렀을 때 팝오버로 보여준다.
const groupNotices = computed(() =>
  conditionUnits.value
    .filter((unit) => unit.type === "group" && unit.notice)
    .map((unit) => unit.notice.conditionName),
);
const hasGroupNotice = computed(() => groupNotices.value.length > 0);

const isNoticeOpen = ref(false);
function handleToggleNotice() {
  isNoticeOpen.value = !isNoticeOpen.value;
}

function isSelected(conditionId) {
  return props.modelValue.includes(conditionId);
}

function handleToggleCondition(conditionId) {
  const next = isSelected(conditionId)
    ? props.modelValue.filter((id) => id !== conditionId)
    : [...props.modelValue, conditionId];
  emit("update:modelValue", next);
}
</script>

<template>
  <div v-if="conditionUnits.length" class="flex flex-col gap-4">
    <div class="relative flex items-center gap-2">
      <h2 class="text-h2 text-ink">우대조건</h2>
      <button
        v-if="hasGroupNotice"
        type="button"
        class="flex h-4 w-4 shrink-0 items-center justify-center"
        :aria-expanded="isNoticeOpen"
        aria-label="우대조건 공통 안내 보기"
        @click="handleToggleNotice"
      >
        <svg class="h-4 w-4 text-blue" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path
            class="text-white"
            d="M12 11v6M12 7.5v.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <template v-if="isNoticeOpen">
        <button
          type="button"
          class="fixed inset-0 z-40 cursor-default"
          aria-label="안내 닫기"
          @click="handleToggleNotice"
        ></button>

        <div
          class="absolute bottom-full left-0 z-50 mb-2 flex w-60 max-w-[75vw] flex-col gap-2 rounded-2xl border border-line bg-white p-4 shadow-popup"
          role="dialog"
        >
          <p
            v-for="(notice, noticeIndex) in groupNotices"
            :key="noticeIndex"
            class="whitespace-pre-line break-keep text-caption text-muted"
          >
            {{ notice }}
          </p>
          <span
            class="absolute left-2 top-full h-3 w-3 -translate-y-1/2 rotate-45 border-b border-r border-line bg-white"
          ></span>
        </div>
      </template>
    </div>

    <div
      v-for="(unit, index) in conditionUnits"
      :key="unit.type === 'standalone' ? unit.condition.preferentialRateConditionId : `group-${unit.groupId}`"
      :class="['flex flex-col gap-2', index > 0 ? 'border-t border-line-soft pt-4' : '']"
    >
      <template v-if="unit.type === 'standalone'">
        <label
          v-if="unit.condition.selectable"
          class="flex items-center justify-between gap-4"
        >
          <span class="flex min-w-0 flex-1 items-center gap-2 break-keep text-body text-ink">
            <input
              type="checkbox"
              class="h-4 w-4 shrink-0 accent-pink"
              :checked="isSelected(unit.condition.preferentialRateConditionId)"
              @change="handleToggleCondition(unit.condition.preferentialRateConditionId)"
            />
            {{ getConditionLabel(unit.condition) }}
          </span>
          <span
            v-if="hasVisibleAdditionalRate(unit.condition)"
            class="shrink-0 whitespace-nowrap text-body font-semibold text-profit tabular-nums"
          >
            {{ formatAdditionalRate(unit.condition.additionalRate) }}
          </span>
        </label>
        <p v-else class="break-keep text-caption text-muted">
          {{ getConditionLabel(unit.condition) }}
        </p>
      </template>

      <template v-else>
        <template v-for="condition in unit.conditions" :key="condition.preferentialRateConditionId">
          <label v-if="condition.selectable" class="flex items-center justify-between gap-4">
            <span class="flex min-w-0 flex-1 items-center gap-2 break-keep text-body text-ink">
              <input
                type="checkbox"
                class="h-4 w-4 shrink-0 accent-pink"
                :checked="isSelected(condition.preferentialRateConditionId)"
                @change="handleToggleCondition(condition.preferentialRateConditionId)"
              />
              {{ getConditionLabel(condition) }}
            </span>
            <span
              v-if="hasVisibleAdditionalRate(condition)"
              class="shrink-0 whitespace-nowrap text-body font-semibold text-profit tabular-nums"
            >
              {{ formatAdditionalRate(condition.additionalRate) }}
            </span>
          </label>
          <div v-else class="flex items-start justify-between gap-4">
            <span class="min-w-0 flex-1 break-keep text-body text-ink">
              {{ getConditionLabel(condition) }}
            </span>
            <span
              v-if="hasVisibleAdditionalRate(condition)"
              class="shrink-0 whitespace-nowrap text-body font-semibold text-profit tabular-nums"
            >
              {{ formatAdditionalRate(condition.additionalRate) }}
            </span>
          </div>
        </template>

        <p
          v-for="detail in unit.details"
          :key="detail.preferentialRateConditionId"
          class="break-keep pl-4 text-caption text-muted"
        >
          • {{ getConditionLabel(detail) }}
        </p>
      </template>
    </div>
  </div>

  <p v-else class="text-caption text-muted">선택 가능한 우대조건이 없어요.</p>
</template>
