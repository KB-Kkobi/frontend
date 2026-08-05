<script setup>
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
});

const emit = defineEmits(["update:model-value"]);

function handleInput(event) {
  emit("update:model-value", event.target.value);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-body font-semibold text-ink">
      {{ label }}
    </label>

    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :aria-describedby="hint || errorMessage ? `${id}-message` : undefined"
      :aria-invalid="Boolean(errorMessage)"
      class="w-full rounded-2xl border border-line bg-white px-4 py-3 text-body text-ink outline-none placeholder:text-muted focus:border-yellow"
      @input="handleInput"
    />

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
