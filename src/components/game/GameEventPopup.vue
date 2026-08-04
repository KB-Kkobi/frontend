<script setup>
import { computed } from "vue";
import BaseAlertIcon from "@/components/common/BaseAlertIcon.vue";
import BaseBadge from "@/components/common/BaseBadge.vue";
import BaseCard from "@/components/common/BaseCard.vue";

const props = defineProps({
  event: {
    type: Object,
    default: null,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const TAG_TONE_COLORS = {
  UP: "pink-soft",
  DOWN: "blue-soft",
  WARN: "yellow-soft",
};

const badgeColor = computed(
  () => TAG_TONE_COLORS[props.event?.tagTone] ?? "yellow-soft",
);
</script>

<template>
  <Teleport to="body">
    <template v-if="visible">
      <div class="fixed inset-0 bg-ink/50" aria-hidden="true" />

      <div class="fixed inset-x-0 top-24 z-10 mx-auto max-w-[430px] px-5">
        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <BaseBadge :color="badgeColor">
                <span class="inline-flex items-center gap-2">
                  <BaseAlertIcon class="h-4 w-4" />
                  {{ event?.tag }}
                </span>
              </BaseBadge>

              <button
                type="button"
                class="p-2 text-muted"
                aria-label="닫기"
                @click="emit('close')"
              >
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>

            <p class="text-h2 text-ink whitespace-pre-line">{{ event?.description }}</p>
          </div>
        </BaseCard>
      </div>
    </template>
  </Teleport>
</template>