<script setup>
import { computed, ref, watch } from "vue";
import { bankLogoMap } from "@/assets/banks/bankLogoMap";

const props = defineProps({
  name: {
    type: String,
    default: "",
  },
});

const logoSrc = computed(() => bankLogoMap[props.name.trim()] ?? null);
const altText = computed(() =>
  props.name.trim() ? `${props.name.trim()} 로고` : "은행 로고",
);

// asset 파일이 손상되었거나 형식이 잘못된 경우에도 깨진 이미지 아이콘 대신
// 기본 금융기관 아이콘으로 대체한다.
const hasLoadError = ref(false);
watch(logoSrc, () => {
  hasLoadError.value = false;
});
</script>

<template>
  <span
    class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface"
  >
    <img
      v-if="logoSrc && !hasLoadError"
      :src="logoSrc"
      :alt="altText"
      class="h-full w-full object-contain"
      @error="hasLoadError = true"
    />
    <svg
      v-else
      class="h-5 w-5 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      role="img"
      :aria-label="altText"
    >
      <path
        d="M4 10.5 12 5l8 5.5M5 10.5V19h14v-8.5M9 19v-5h6v5M3 19h18"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</template>
