<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import { PORTFOLIO_SEGMENT_DEFINITIONS } from "@/constants/assessment";

const props = defineProps({
  stockReason: {
    type: String,
    default: "",
  },
  bondReason: {
    type: String,
    default: "",
  },
  depositReason: {
    type: String,
    default: "",
  },
  stockRatio: {
    type: Number,
    required: true,
  },
  bondRatio: {
    type: Number,
    required: true,
  },
  depositRatio: {
    type: Number,
    required: true,
  },
});

const REASON_KEYS = {
  stockRatio: "stockReason",
  bondRatio: "bondReason",
  depositRatio: "depositReason",
};

const DOT_COLOR_CLASSES = {
  pink: "bg-pink",
  blue: "bg-blue",
  green: "bg-green",
};

const reasons = computed(() =>
  PORTFOLIO_SEGMENT_DEFINITIONS.map((segment) => ({
    key: segment.key,
    label: segment.label,
    ratio: props[segment.key],
    reason: props[REASON_KEYS[segment.key]],
    dotClass: DOT_COLOR_CLASSES[segment.color],
  })).filter((item) => item.reason),
);
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-navy">왜 이렇게 배분했을까요?</h2>
        <p class="text-caption text-muted tracking-tight">
          성향에 맞춰 자산마다 다른 역할을 담았어요.
        </p>
      </div>

      <div class="border-t border-line-soft" />

      <ul class="flex flex-col gap-4">
        <li v-for="item in reasons" :key="item.key" class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <span
              class="h-3 w-3 shrink-0 rounded-full"
              :class="item.dotClass"
              aria-hidden="true"
            />
            <h3 class="text-body font-semibold text-ink">
              {{ item.label }} <span class="tabular-nums">{{ item.ratio }}%</span>
            </h3>
          </div>
          <p class="text-body text-ink tracking-tight">{{ item.reason }}</p>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
