<script setup>
defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  id: {
    type: String,
    required: true,
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
  autocomplete: {
    type: String,
    default: "off",
  },
  inputmode: {
    type: String,
    default: undefined,
  },
  hint: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  required: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

function handleInput(event) {
  emit("update:modelValue", event.target.value);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-caption font-semibold text-ink">
      {{ label }}
    </label>
    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :required="required"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
      :class="[
        error ? 'border-error' : 'border-line',
        'w-full rounded-2xl border bg-white px-4 py-3 text-body text-ink outline-none placeholder:text-muted focus:border-blue',
      ]"
      @input="handleInput"
    />
    <p v-if="error" :id="`${id}-error`" class="text-caption text-error">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-caption text-muted">
      {{ hint }}
    </p>
  </div>
</template>
