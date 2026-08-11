<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import AxisBadgeRow from "@/components/assessment/AxisBadgeRow.vue";
import { getAxisBadgesFromScores } from "@/constants/assessment";
import { resolveAssetUrl } from "@/utils/url";

const props = defineProps({
  feature: {
    type: String,
    default: "",
  },
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
});

const imageUrl = computed(() => resolveAssetUrl(props.imagePath));

const axisBadges = computed(() => getAxisBadgesFromScores(props.scores));
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col items-center gap-4 text-center">
      <p v-if="feature" class="text-caption text-muted">{{ feature }}</p>

      <h1 class="text-h1 font-bold text-navy">{{ personaName }}</h1>

      <AxisBadgeRow :badges="axisBadges" />

      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="personaName"
        class="h-48 w-48 object-contain"
      />

      <p class="text-body text-ink">{{ description }}</p>
    </div>
  </BaseCard>
</template>
