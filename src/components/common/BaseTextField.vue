<script setup>
import { computed, ref } from "vue";

defineProps({
  id: {
    type: String,
    required: true,
  },
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "text",
  },
  placeholder: {
    type: String,
    default: "",
  },
  hint: {
    type: String,
    default: "",
  },
  errorMessage: {
    type: String,
    default: "",
  },
  autocomplete: {
    type: String,
    default: "off",
  },
  inputmode: {
    type: String,
    default: undefined,
  },
  maxlength: {
    type: Number,
    default: undefined,
  },
  trailingText: {
    type: String,
    default: "",
  },
  showCalendarChevron: {
    type: Boolean,
    default: true,
  },
  icon: {
    type: String,
    default: "",
    validator: (value) => ["", "email", "password", "user", "calendar"].includes(value),
  },
});

const emit = defineEmits(["update:model-value"]);
const isPasswordVisible = ref(false);

const inputType = computed(() =>
  isPasswordVisible.value ? "text" : undefined,
);

function handleInput(event) {
  emit("update:model-value", event.target.value);
}

function handlePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value;
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-body font-semibold text-ink">
      {{ label }}
    </label>

    <div class="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 focus-within:border-pink">
      <svg
        v-if="icon === 'email'"
        class="h-6 w-6 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.75" />
        <path d="M4 7L12 13L20 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <svg
        v-else-if="icon === 'password'"
        class="h-6 w-6 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.75" />
        <path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        <path d="M12 14V17" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
      </svg>

      <svg
        v-else-if="icon === 'user'"
        class="h-6 w-6 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.75" />
        <path d="M4 21C4 16.6 7.6 13 12 13C16.4 13 20 16.6 20 21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
      </svg>

      <svg
        v-else-if="icon === 'calendar'"
        class="h-6 w-6 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.75" />
        <path d="M7 3V7M17 3V7M3 9H21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        <path d="M7 13H9M11 13H13M15 13H17M7 17H9M11 17H13M15 17H17" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
      </svg>

      <input
        :id="id"
        :value="modelValue"
        :type="inputType || type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :aria-describedby="hint || errorMessage ? `${id}-message` : undefined"
        :aria-invalid="Boolean(errorMessage)"
        class="min-w-0 flex-1 bg-white py-3 text-body text-ink outline-none placeholder:text-muted"
        @input="handleInput"
      />

      <button
        v-if="icon === 'password'"
        type="button"
        class="shrink-0 text-muted"
        :aria-label="isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'"
        @click="handlePasswordVisibility"
      >
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 12C5 8.5 8 7 12 7C16 7 19 8.5 21 12C19 15.5 16 17 12 17C8 17 5 15.5 3 12Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
          <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.75" />
          <path v-if="!isPasswordVisible" d="M4 4L20 20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        </svg>
      </button>

      <svg
        v-else-if="icon === 'calendar' && showCalendarChevron"
        class="h-6 w-6 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <span v-else-if="trailingText" class="shrink-0 text-caption text-pink tabular-nums">
        {{ trailingText }}
      </span>
    </div>

    <p
      v-if="hint || errorMessage"
      :id="`${id}-message`"
      :class="['text-caption', errorMessage ? 'text-error' : 'text-muted']"
      :role="errorMessage ? 'alert' : undefined"
    >
      {{ errorMessage || hint }}
    </p>
  </div>
</template>
