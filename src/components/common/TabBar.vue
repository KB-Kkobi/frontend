<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

function handleSelect(key) {
  emit("update:modelValue", key);
}
</script>

<template>
  <nav class="flex gap-2">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      :class="[
        'flex-1 border-b-2 py-3 text-body tracking-tight',
        modelValue === tab.key
          ? 'border-pink text-ink font-semibold'
          : 'border-transparent text-muted',
      ]"
      @click="handleSelect(tab.key)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
