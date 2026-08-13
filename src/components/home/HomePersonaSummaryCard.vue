<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import AxisBadgeRow from "@/components/assessment/AxisBadgeRow.vue";
import { PORTFOLIO_SEGMENT_DEFINITIONS, getAxisBadgesFromScores } from "@/constants/assessment";
import { getFirstSentence } from "@/utils/format";
import { resolveAssetUrl } from "@/utils/url";

const props = defineProps({
  personaName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  imagePath: {
    type: String,
    default: null,
  },
  scores: {
    type: Object,
    required: true,
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

const router = useRouter();

const BAR_COLOR_CLASSES = {
  pink: "bg-pink",
  blue: "bg-blue",
  green: "bg-green",
};

const imageUrl = computed(() => resolveAssetUrl(props.imagePath));
const summarySentence = computed(() => getFirstSentence(props.description));
const axisBadges = computed(() => getAxisBadgesFromScores(props.scores));

const segments = computed(() =>
  PORTFOLIO_SEGMENT_DEFINITIONS.map((segment) => ({
    key: segment.key,
    label: segment.label,
    barClass: BAR_COLOR_CLASSES[segment.color],
    value: props[segment.key],
  })),
);

const barLabel = computed(() =>
  segments.value.map((segment) => `${segment.label} ${segment.value}%`).join(", "),
);

function handleViewDetail() {
  router.push({ name: "assessment-result" });
}
</script>

<template>
  <BaseCard color="white" elevation="highlight">
    <div class="flex flex-col gap-4">
      <h2 class="text-h2 text-ink">내 투자 성향</h2>

      <div class="flex flex-col items-center gap-4 text-center">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="personaName"
          class="h-40 w-40 object-contain"
        />

        <p class="text-h1 font-bold text-navy">{{ personaName }}</p>

        <AxisBadgeRow :badges="axisBadges" />

        <p class="text-caption text-muted">{{ summarySentence }}</p>
      </div>

      <h2 class="text-h2 text-ink">추천 포트폴리오 비율</h2>

      <ul class="flex flex-wrap gap-4">
        <li
          v-for="segment in segments"
          :key="segment.key"
          class="flex items-center gap-2 text-caption text-ink"
        >
          <span
            class="h-3 w-3 rounded-full"
            :class="segment.barClass"
            aria-hidden="true"
          />
          {{ segment.label }}
        </li>
      </ul>

      <div
        class="flex h-4 w-full overflow-hidden rounded-full bg-surface"
        role="img"
        :aria-label="barLabel"
      >
        <div
          v-for="segment in segments"
          :key="segment.key"
          :class="segment.barClass"
          :style="{ width: `${segment.value}%` }"
        />
      </div>

      <ul class="flex justify-between">
        <li
          v-for="segment in segments"
          :key="segment.key"
          class="flex flex-col items-center gap-1"
        >
          <span class="text-caption text-muted">{{ segment.label }}</span>
          <span class="text-body font-semibold text-navy tabular-nums">{{ segment.value }}%</span>
        </li>
      </ul>

      <button
        type="button"
        class="self-end text-caption text-navy"
        @click="handleViewDetail"
      >
        성향 자세히 보기 &gt;
      </button>
    </div>
  </BaseCard>
</template>
