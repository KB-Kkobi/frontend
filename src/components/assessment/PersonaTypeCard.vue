<script setup>
import { computed, ref } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import AxisBadgeRow from "@/components/assessment/AxisBadgeRow.vue";
import StrengthCautionCard from "@/components/assessment/StrengthCautionCard.vue";
import { getAxisBadgesFromCode } from "@/constants/assessment";
import { resolveAssetUrl } from "@/utils/url";

const props = defineProps({
  personaName: {
    type: String,
    required: true,
  },
  feature: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  imagePath: {
    type: String,
    default: null,
  },
  axisCode: {
    type: String,
    required: true,
  },
  strength: {
    type: String,
    default: "",
  },
  caution: {
    type: String,
    default: "",
  },
});

const isExpanded = ref(false);

const imageUrl = computed(() => resolveAssetUrl(props.imagePath));
const badges = computed(() => getAxisBadgesFromCode(props.axisCode));

function toggle() {
  isExpanded.value = !isExpanded.value;
}
</script>

<template>
  <div :class="isExpanded ? 'rounded-3xl ring-2 ring-yellow' : ''">
    <BaseCard color="white">
      <button type="button" class="flex w-full flex-col gap-3 text-left" @click="toggle">
        <div class="flex items-center gap-4">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="personaName"
            class="h-12 w-12 shrink-0 rounded-full object-cover"
          />

          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <h2 class="truncate text-h2 font-bold text-navy">{{ personaName }}</h2>
            <p class="truncate text-caption text-muted">{{ feature }}</p>
          </div>

          <svg
            class="h-6 w-6 shrink-0 text-muted transition-transform"
            :class="isExpanded ? 'rotate-180' : ''"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <AxisBadgeRow :badges="badges" />
      </button>

      <div v-if="isExpanded" class="flex flex-col gap-4 pt-4">
        <p class="text-body text-ink">{{ description }}</p>
        <StrengthCautionCard :strength="strength" :caution="caution" />
      </div>
    </BaseCard>
  </div>
</template>