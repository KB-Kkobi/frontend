<script setup>
import { AXIS_DEFINITIONS } from "@/constants/assessment";

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

function close() {
  emit("update:modelValue", false);
}
</script>

<template>
  <template v-if="modelValue">
    <button
      type="button"
      class="fixed inset-0 z-40 cursor-default"
      aria-label="도움말 닫기"
      @click="close"
    ></button>

    <div
      class="absolute -right-20 top-full z-50 mt-2 w-60 flex-col gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-popup flex"
      role="dialog"
      aria-labelledby="axis-help-title"
    >
      <h2 id="axis-help-title" class="sr-only">투자 성향 3축 용어 설명</h2>
      <div v-for="axis in AXIS_DEFINITIONS" :key="axis.key" class="flex flex-col gap-1">
        <span class="text-body font-bold text-ink">{{ axis.label }}</span>
        <p class="text-caption text-muted">{{ axis.description }}</p>
      </div>
    </div>
  </template>
</template>