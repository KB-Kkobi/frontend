<script setup>
defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "검색" },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "search", "clear"]);

function handleInput(event) {
  emit("update:modelValue", event.target.value);
}

function handleSubmit() {
  emit("search");
}

function handleClear() {
  emit("update:modelValue", "");
  emit("clear");
}
</script>

<template>
  <form
    class="flex items-center gap-2 rounded-3xl bg-surface px-4"
    role="search"
    @submit.prevent="handleSubmit"
  >
    <svg
      class="h-5 w-5 shrink-0 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke-width="2" />
      <path d="m16 16 4 4" stroke-width="2" stroke-linecap="round" />
    </svg>
    <input
      :value="modelValue"
      type="search"
      class="min-w-0 flex-1 bg-transparent py-3 text-body text-ink outline-none"
      :placeholder="placeholder"
      :aria-label="placeholder"
      :disabled="disabled"
      @input="handleInput"
    />
    <button
      v-if="clearable && modelValue"
      type="button"
      class="shrink-0 text-muted"
      :aria-label="`${placeholder} 지우기`"
      @click="handleClear"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M18 6 6 18M6 6l12 12"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </form>
</template>
