<script setup>
import { SELECTABLE_PROFILE_IMAGE_OPTIONS } from "@/constants/profileImages";

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <fieldset class="flex flex-col gap-2 border-b border-line-soft pb-4">
    <legend class="text-h2 text-ink">프로필 이미지</legend>
    <p class="text-caption text-muted">마음에 드는 꼬비를 골라 주세요.</p>

    <div class="grid grid-cols-3 gap-2">
      <label
        v-for="option in SELECTABLE_PROFILE_IMAGE_OPTIONS"
        :key="option.id"
        :class="[
          'relative flex h-16 w-16 cursor-pointer items-center justify-center justify-self-center overflow-hidden rounded-full border-2 bg-white transition-colors focus-within:border-pink',
          modelValue === option.id
            ? 'border-pink'
            : 'border-line-soft',
        ]"
      >
        <input
          type="radio"
          name="profile-image"
          :value="option.id"
          :checked="modelValue === option.id"
          class="sr-only"
          @change="emit('update:modelValue', option.id)"
        />

        <img
          :src="option.imageUrl"
          :alt="option.label"
          :class="[
            'h-full w-full',
            option.fit === 'contain' ? 'object-contain' : 'object-cover',
          ]"
        />
      </label>
    </div>
  </fieldset>
</template>
