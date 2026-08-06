<script setup>
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
    validator: (value) => ["wallet", "calendar"].includes(value),
  },
  modelValue: {
    type: Number,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
  maximum: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

function formatInputAmount(value) {
  return value.toLocaleString("ko-KR");
}

function normalizeAmount(value) {
  const digits = String(value).replace(/\D/g, "");
  const amount = digits ? Number(digits) : 0;
  return Math.min(amount, props.maximum);
}

function handleInput(event) {
  const amount = normalizeAmount(event.target.value);
  event.target.value = formatInputAmount(amount);
  emit("update:modelValue", amount);
}

function handleSelect(value) {
  emit("update:modelValue", value);
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <div class="flex items-start gap-2">
      <span
        :class="[
          icon === 'wallet' ? 'bg-yellow' : 'bg-blue',
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-ink',
        ]"
        aria-hidden="true"
      >
        <svg
          v-if="icon === 'wallet'"
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 7.5H19.5V18.5H4C2.9 18.5 2 17.6 2 16.5V5.5C2 4.4 2.9 3.5 4 3.5H17V7.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M15 11H21V15H15C13.9 15 13 14.1 13 13C13 11.9 13.9 11 15 11Z"
            fill="currentColor"
          />
        </svg>

        <svg
          v-else
          class="h-4 w-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 3V6M17 3V6M4 9H20M5 5H19C19.6 5 20 5.4 20 6V19C20 19.6 19.6 20 19 20H5C4.4 20 4 19.6 4 19V6C4 5.4 4.4 5 5 5Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path
            d="M9 13L11 15L15 11"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <div class="flex min-w-0 flex-col gap-2">
        <label :for="id" class="text-h2 text-ink">{{ title }}</label>
        <p class="text-caption text-muted">{{ description }}</p>
      </div>
    </div>

    <div
      class="flex items-center gap-2 rounded-2xl border border-ink bg-white px-4 focus-within:border-blue"
    >
      <input
        :id="id"
        :value="formatInputAmount(modelValue)"
        class="min-w-0 flex-1 bg-transparent py-3 text-h1 text-ink outline-none tabular-nums"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :aria-describedby="`${id}-description`"
        @input="handleInput"
      />
      <span class="text-caption font-semibold text-ink">원</span>
      <svg
        class="h-5 w-5 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M4 20L8.5 19L19 8.5C19.8 7.7 19.8 6.3 19 5.5L18.5 5C17.7 4.2 16.3 4.2 15.5 5L5 15.5L4 20Z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <span :id="`${id}-description`" class="sr-only">
      최대 {{ formatInputAmount(maximum) }}원까지 입력할 수 있습니다.
    </span>

    <div class="grid grid-cols-4 gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :class="[
          modelValue === option.value
            ? 'border-ink bg-ink text-white'
            : 'border-line bg-white text-muted',
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl border px-pill-x py-pill-y text-caption font-semibold',
        ]"
        @click="handleSelect(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </section>
</template>
