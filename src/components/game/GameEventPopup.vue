<script setup>
import BaseAlertIcon from '@/components/common/BaseAlertIcon.vue';
import BaseBadge from '@/components/common/BaseBadge.vue';
import BaseCard from '@/components/common/BaseCard.vue';

defineProps({
  event: {
    type: Object,
    default: null,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-10 bg-ink/20"
      @click.self="emit('close')"
    >
      <div class="mx-auto max-w-[430px] px-5 pt-24">
        <BaseCard color="white" elevation="highlight">
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <BaseBadge color="error-soft">
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

            <p class="text-h2 text-ink whitespace-pre-line">
              {{ event?.description }}
            </p>
          </div>
        </BaseCard>
      </div>
    </div>
  </Teleport>
</template>
