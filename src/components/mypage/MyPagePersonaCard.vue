<script setup>
import { computed } from "vue";
import AxisBadgeRow from "@/components/assessment/AxisBadgeRow.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import { getAxisBadgesFromScores } from "@/constants/assessment";
import { resolveAssetUrl } from "@/utils/url";

const props = defineProps({
  personaName: {
    type: String,
    default: "",
  },
  imagePath: {
    type: String,
    default: null,
  },
  scores: {
    type: Object,
    default: () => ({}),
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const imageUrl = computed(() => resolveAssetUrl(props.imagePath));
const badges = computed(() => getAxisBadgesFromScores(props.scores));

function handleSelect() {
  emit("select");
}
</script>

<template>
  <BaseCard color="white" elevation="highlight">
    <button
      type="button"
      class="flex w-full flex-col gap-4 text-left"
      @click="handleSelect"
    >
      <div v-if="isLoading" class="flex items-center gap-4" role="status">
        <span class="h-20 w-20 shrink-0 rounded-full bg-surface" aria-hidden="true" />
        <div class="flex flex-col gap-2">
          <p class="text-caption text-muted">내 성향 리포트</p>
          <h2 class="text-h2 text-navy">투자 성향을 불러오는 중이에요</h2>
        </div>
      </div>

      <template v-else-if="personaName">
        <div class="flex items-center gap-4">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="personaName"
            class="h-20 w-20 shrink-0 object-contain"
          />

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <p class="text-caption text-muted">내 성향 리포트</p>
            <h2 class="text-h1 font-bold text-navy">{{ personaName }}</h2>
          </div>
        </div>

        <AxisBadgeRow :badges="badges" />
      </template>

      <div v-else class="flex flex-col gap-2">
        <p class="text-caption text-muted">내 성향 리포트</p>
        <h2 class="text-h2 text-navy">아직 확인된 투자 성향이 없어요</h2>
        <p class="text-caption text-muted">투자 게임을 완료하고 성향을 확인해 보세요.</p>
      </div>
    </button>
  </BaseCard>
</template>
