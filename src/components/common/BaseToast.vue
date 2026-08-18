<script setup>
import { onBeforeUnmount, watch } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  duration: {
    type: Number,
    default: 3000,
  },
  // 상단 고정 헤더가 있는 화면에서는 헤더에 가리지 않도록 "header"를 사용한다.
  offset: {
    type: String,
    default: "page",
    validator: (v) => ["page", "header"].includes(v),
  },
  // 실패 알림에는 "error"를 사용해 제목 색을 text-error로 바꾼다.
  variant: {
    type: String,
    default: "success",
    validator: (v) => ["success", "error"].includes(v),
  },
});

const OFFSET_CLASSES = {
  page: "top-6",
  header: "top-32",
};

const TITLE_COLOR_CLASSES = {
  success: "text-success",
  error: "text-error",
};

const emit = defineEmits(["update:modelValue"]);

let hideTimer = null;

function clearHideTimer() {
  if (hideTimer === null) return;
  clearTimeout(hideTimer);
  hideTimer = null;
}

watch(
  () => props.modelValue,
  (isVisible) => {
    clearHideTimer();
    if (!isVisible) return;

    hideTimer = setTimeout(() => {
      hideTimer = null;
      emit("update:modelValue", false);
    }, props.duration);
  },
  { immediate: true },
);

onBeforeUnmount(clearHideTimer);
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="modelValue"
        :class="[
          OFFSET_CLASSES[offset],
          'pointer-events-none fixed inset-x-0 z-50 flex justify-center',
        ]"
        role="status"
        aria-live="polite"
      >
        <!-- PageContainer와 동일한 폭·좌우 여백으로 본문 카드와 정렬을 맞춘다 -->
        <div class="w-full max-w-[430px] px-5">
          <BaseCard color="white">
            <div class="flex flex-col gap-2">
              <p :class="['text-h2 tracking-tight', TITLE_COLOR_CLASSES[variant]]">{{ title }}</p>
              <p v-if="description" class="text-caption text-muted tracking-tight">
                {{ description }}
              </p>
            </div>
          </BaseCard>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
