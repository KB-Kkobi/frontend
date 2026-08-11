<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import { formatRate, formatVolatility, formatKoreanShortAmount } from "@/utils/format";
import { INSIGHT_BASE_AMOUNT } from "@/constants/insight";

const props = defineProps({
  period: { type: String, default: "최근 3년 기준" },
  productName: { type: String, default: "" },
  averageDailyMove: { type: Number, default: null },
  maxDrawdown: { type: Number, default: null },
  description: { type: Object, default: null },
});

const averageDailyMoveLabel = computed(() =>
  formatVolatility(props.averageDailyMove),
);

const averageDailyMoveAmountLabel = computed(() => {
  if (
    props.averageDailyMove === null ||
    props.averageDailyMove === undefined
  ) {
    return "—";
  }
  const amount =
    (INSIGHT_BASE_AMOUNT * Math.abs(props.averageDailyMove)) / 100;
  return `약 ${formatKoreanShortAmount(amount)}`;
});

const maxDrawdownLabel = computed(() => formatRate(props.maxDrawdown));
</script>

<template>
  <BaseCard>
    <div class="flex flex-col gap-4">
      <!-- 헤더 -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-col gap-2">
          <h2 class="text-h2 text-ink">알아두면 좋아요</h2>
          <p v-if="productName" class="truncate text-caption text-muted">
            {{ productName }}
          </p>
        </div>
        <span class="text-caption text-muted">{{ period }}</span>
      </div>

      <!-- 행 목록 -->
      <div class="flex flex-col">
        <!-- 1. 변동률 -->
        <div class="flex items-center gap-4 pb-4 border-b border-line-soft">
          <div class="flex items-center justify-center rounded-2xl bg-yellow-soft p-2">
            <svg
              class="w-5 h-5 text-yellow"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
              />
            </svg>
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-body font-semibold text-ink tracking-tight">
              하루 평균
              <span class="tabular-nums">{{ averageDailyMoveLabel }}</span>
              움직여요
            </p>
            <p class="text-caption text-muted tracking-tight">
              100만원 넣었다면
              <span class="tabular-nums">{{ averageDailyMoveAmountLabel }}</span>
            </p>
          </div>
        </div>

        <!-- 2. 최대 낙폭 -->
        <div class="flex items-center gap-4 py-4 border-b border-line-soft">
          <div class="flex items-center justify-center rounded-2xl bg-blue-soft p-2">
            <svg
              class="w-5 h-5 text-blue"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181"
              />
            </svg>
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-body font-semibold text-ink tracking-tight">
              가장 많이 떨어졌을 땐
              <span class="tabular-nums">{{ maxDrawdownLabel }}</span>
            </p>
            <p class="text-caption text-muted tracking-tight">고점 대비 최대 낙폭이에요</p>
          </div>
        </div>

        <!-- 3. 증권 설명 (추후 채움) -->
        <div class="flex items-center gap-4 pt-4">
          <div class="flex items-center justify-center rounded-2xl bg-pink-soft p-2">
            <svg
              class="w-5 h-5 text-pink"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-body font-semibold text-ink tracking-tight">
              {{ description?.title ?? '' }}
            </p>
            <p class="text-caption text-muted tracking-tight">
              {{ description?.caption ?? '' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
