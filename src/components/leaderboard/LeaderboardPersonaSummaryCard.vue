<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import { resolveAssetUrl } from "@/utils/url";

const props = defineProps({
  personaName: {
    type: String,
    default: null,
  },
  imagePath: {
    type: String,
    default: null,
  },
  myRank: {
    type: Number,
    default: null,
  },
  participantCount: {
    type: Number,
    default: null,
  },
});

const imageUrl = computed(() => resolveAssetUrl(props.imagePath));
const hasRank = computed(() => Number.isFinite(Number(props.myRank)) && props.myRank !== null);
const hasParticipantCount = computed(() => Number(props.participantCount) > 0);
</script>

<template>
  <BaseCard color="white" elevation="highlight">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col items-center gap-2 text-center">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="personaName"
          class="h-32 w-32 object-contain"
        />

        <p class="text-caption text-muted tracking-tight">같은 성향끼리 비교하고 있어요</p>

        <p v-if="personaName" class="text-h1 font-bold text-navy">{{ personaName }}</p>
      </div>

      <div class="border-t border-line-soft" />

      <div class="flex items-baseline justify-between gap-2">
        <span class="text-caption text-muted tracking-tight">현재 내 순위</span>

        <span class="flex items-baseline gap-2">
          <span v-if="hasParticipantCount" class="text-caption text-muted tabular-nums">
            총 {{ participantCount }}명 중
          </span>
          <span v-if="hasRank" class="text-amount text-navy tabular-nums">
            {{ myRank }}<span class="text-h2">위</span>
          </span>
          <span v-else class="text-h2 text-muted">—</span>
        </span>
      </div>
    </div>
  </BaseCard>
</template>
