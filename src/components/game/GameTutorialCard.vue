<script setup>
import { computed } from 'vue';
import BaseCard from '@/components/common/BaseCard.vue';
import BasePill from '@/components/common/BasePill.vue';
import BottomButton from '@/components/common/BottomButton.vue';

const props = defineProps({
  image: {
    type: String,
    required: true,
  },
  imageScale: {
    type: Number,
    default: 1,
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'compact',
    validator: (value) => ['compact', 'start'].includes(value),
  },
  showPrev: {
    type: Boolean,
    default: false,
  },
  prevDisabled: {
    type: Boolean,
    default: false,
  },
  nextLabel: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: '',
  },
  lightweight: {
    type: Boolean,
    default: false,
  },
  watchStatusText: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['prev', 'next', 'confirm']);

const isStart = computed(() => props.variant === 'start');
const hasFooter = computed(
  () => props.showPrev || !!props.nextLabel || !!props.confirmLabel,
);
</script>

<template>
  <div class="pointer-events-auto">
    <BaseCard color="white" elevation="float" density="tutorial">
      <div class="grid min-h-36 grid-cols-tutorial-card gap-2">
        <div class="flex flex-col items-center justify-center gap-1 self-stretch">
          <img
            :src="image"
            alt=""
            class="h-[88px] w-[88px] max-w-none object-contain animate-char-float"
            :style="{ '--kkobi-scale': imageScale }"
            aria-hidden="true"
          />
          <BasePill label="꼬비" color="pink" />
        </div>

        <div class="flex min-w-0 flex-col justify-center gap-2">
          <h3
            v-if="title"
            :class="[
              'min-w-0 break-keep text-balance',
              isStart ? 'text-h1 text-navy' : 'text-h2 text-ink',
            ]"
          >
            {{ title }}
          </h3>

          <div class="flex min-w-0 flex-col gap-1">
            <p class="whitespace-pre-line break-keep text-pretty text-body text-ink">
              {{ message }}
            </p>
            <div
              v-if="lightweight"
              class="inline-flex items-center self-start gap-2 rounded-full bg-surface px-pill-x py-pill-y"
              role="status"
              aria-label="가격 움직임을 지켜보는 중"
            >
              <span
                class="h-2 w-2 rounded-full bg-pink animate-tutorial-watch-beacon"
                aria-hidden="true"
              ></span>
              <span class="text-caption font-semibold text-muted" aria-hidden="true">
                {{ watchStatusText }}
              </span>
            </div>
          </div>

          <footer v-if="hasFooter" class="flex gap-2">
            <BottomButton
              v-if="showPrev"
              color="white"
              :disabled="prevDisabled"
              @click="emit('prev')"
            >
              이전
            </BottomButton>
            <BottomButton
              v-if="nextLabel"
              color="pink"
              @click="emit('next')"
            >
              {{ nextLabel }}
            </BottomButton>
            <BottomButton
              v-if="confirmLabel"
              color="pink"
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </BottomButton>
          </footer>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
