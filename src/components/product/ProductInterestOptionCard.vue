<script setup>
import { computed, ref, watch } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import { formatAdditionalRate, formatInterestRate } from "@/utils/format";
import {
  getConditionLabel,
  groupPreferentialConditions,
  hasVisibleAdditionalRate,
} from "@/utils/preferentialConditions";

// 우대조건 목록에 노출할 단위(단독 조건 1개 = 1개, 그룹 1개 = 1개) 개수.
const PREFERENTIAL_CONDITIONS_VISIBLE_COUNT = 3;

const props = defineProps({
  option: {
    type: Object,
    required: true,
  },
});

const savingTermLabel = computed(() =>
  Number.isFinite(Number(props.option.savingTerm))
    ? `${props.option.savingTerm}개월`
    : "—",
);

const hasReserveType = computed(
  () =>
    props.option.reserveType !== "NONE" &&
    Boolean(props.option.reserveTypeName),
);

const conditionUnits = computed(() =>
  groupPreferentialConditions(props.option.preferentialRateConditions),
);

// 그룹의 공통 안내(GROUP_NOTICE) 문구. "우대조건" 제목 옆 정보 아이콘을 눌렀을
// 때 팝오버로 보여준다. 그룹이 여러 개면 안내 문구도 함께 모아서 보여준다.
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

// 가입기간(옵션)을 옮기면 안내/펼침 상태를 새 옵션 기준으로 초기화한다.
const isConditionsExpanded = ref(false);
watch(
  () => props.option.productOptionId,
  () => {
    isConditionsExpanded.value = false;
    isNoticeOpen.value = false;
  },
);

// 더보기/접기는 세부 문장 개수가 아니라 "우대조건 단위(단독 1개 또는 그룹 1개)"
// 개수를 기준으로 동작한다. 그룹은 항상 통째로 보이거나 통째로 숨겨진다.
const visibleUnits = computed(() =>
  isConditionsExpanded.value
    ? conditionUnits.value
    : conditionUnits.value.slice(0, PREFERENTIAL_CONDITIONS_VISIBLE_COUNT),
);
const hiddenUnitsCount = computed(() =>
  Math.max(
    conditionUnits.value.length - PREFERENTIAL_CONDITIONS_VISIBLE_COUNT,
    0,
  ),
);

function handleToggleConditions() {
  isConditionsExpanded.value = !isConditionsExpanded.value;
}
</script>

<template>
  <BaseCard color="white" elevation="flat">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <span class="text-body font-semibold text-ink tabular-nums">
          {{ savingTermLabel }}
        </span>
        <span v-if="hasReserveType" class="text-caption text-muted">
          · {{ option.reserveTypeName }}
        </span>
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
      </dl>

      <div
        v-if="conditionUnits.length"
        class="flex flex-col gap-2 border-t border-line pt-4"
      >
        <div class="relative flex items-center gap-2">
          <span class="text-caption text-muted">우대조건</span>
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

        <template v-for="(unit, index) in visibleUnits" :key="unit.type === 'standalone' ? unit.condition.preferentialRateConditionId : `group-${unit.groupId}`">
          <div
            :class="[
              'flex flex-col gap-2',
              index > 0 ? 'border-t border-line-soft pt-2' : '',
            ]"
          >
            <div v-if="unit.type === 'standalone'" class="flex items-start justify-between gap-4">
              <span
                :class="unit.condition.selectable === false ? 'text-caption text-muted' : 'text-body text-ink'"
                class="min-w-0 flex-1 break-keep"
              >
                {{ getConditionLabel(unit.condition) }}
              </span>
              <span
                v-if="hasVisibleAdditionalRate(unit.condition)"
                class="shrink-0 whitespace-nowrap text-body font-semibold text-profit tabular-nums"
              >
                {{ formatAdditionalRate(unit.condition.additionalRate) }}
              </span>
            </div>

            <template v-else>
              <div
                v-for="condition in unit.conditions"
                :key="condition.preferentialRateConditionId"
                class="flex items-start justify-between gap-4"
              >
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

              <p
                v-for="detail in unit.details"
                :key="detail.preferentialRateConditionId"
                class="break-keep pl-4 text-caption text-muted"
              >
                • {{ getConditionLabel(detail) }}
              </p>
            </template>
          </div>
        </template>

        <button
          v-if="hiddenUnitsCount > 0 || isConditionsExpanded"
          type="button"
          class="text-left text-caption font-semibold text-pink"
          @click="handleToggleConditions"
        >
          {{
            isConditionsExpanded
              ? "접기"
              : `다른 우대조건 ${hiddenUnitsCount}개 더보기`
          }}
        </button>
      </div>
    </div>
  </BaseCard>
</template>
