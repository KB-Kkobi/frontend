<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import { formatCurrency, formatNullableText, formatRate } from "@/utils/format";

const props = defineProps({
  rank: {
    type: Number,
    required: true,
  },
  nickname: {
    type: String,
    default: "",
  },
  personaName: {
    type: String,
    default: null,
  },
  totalAsset: {
    type: Number,
    default: null,
  },
  returnRate: {
    type: Number,
    default: null,
  },
  isMe: {
    type: Boolean,
    default: false,
  },
});

const isTopRank = computed(() => Number(props.rank) <= 3);

// 상위 3위는 크림 톤 배지로만 절제해 강조한다(별도 금·은·동 표현 없음).
const rankBadgeClass = computed(() =>
  isTopRank.value ? "bg-cream-soft text-ink font-bold" : "bg-surface text-muted font-semibold",
);

const rateColorClass = computed(() => {
  if (props.returnRate === null || props.returnRate === undefined) return "text-muted";
  if (props.returnRate > 0) return "text-profit";
  if (props.returnRate < 0) return "text-loss";
  return "text-muted";
});
</script>

<template>
  <BaseCard :color="isMe ? 'pink' : 'white'" :elevation="isMe ? 'default' : 'flat'">
    <div class="flex items-center gap-4">
      <span
        :class="[
          rankBadgeClass,
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-body tabular-nums',
        ]"
      >
        {{ rank }}
      </span>

      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="min-w-0 truncate text-body font-semibold text-ink tracking-tight">
            {{ formatNullableText(nickname) }}
          </span>
          <BasePill v-if="isMe" label="나" color="pink" variant="outline" />
        </div>
        <p v-if="personaName" class="truncate text-caption text-muted tracking-tight">
          {{ formatNullableText(personaName) }}
        </p>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-2">
        <span class="text-body font-semibold text-ink tabular-nums">
          {{ formatCurrency(totalAsset) }}
        </span>
        <span :class="[rateColorClass, 'text-caption font-semibold tabular-nums']">
          {{ formatRate(returnRate) }}
        </span>
      </div>
    </div>
  </BaseCard>
</template>
