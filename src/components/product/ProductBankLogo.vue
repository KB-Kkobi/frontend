<script setup>
import { computed, ref, watch } from "vue";
import { bankLogoMap } from "@/assets/banks/bankLogoMap";

const props = defineProps({
  name: {
    type: String,
    default: "",
  },
});

// 가로형 CI와 세로형/정사각형 심볼 두 가지만 구분한다. 은행별 개별 px 값은 두지 않는다.
const HORIZONTAL_LOGO_CLASS = "h-7 w-16 object-contain";
const VERTICAL_LOGO_CLASS = "h-10 w-10 object-contain";

const logoSrc = computed(() => bankLogoMap[props.name.trim()] ?? null);
const altText = computed(() =>
  props.name.trim() ? `${props.name.trim()} 로고` : "은행 로고",
);

// asset 파일이 손상되었거나 형식이 잘못된 경우에도 깨진 이미지 아이콘 대신
// 기본 금융기관 아이콘으로 대체한다.
const hasLoadError = ref(false);
// 로드된 원본 비율에 따라 가로형/세로형 중 어느 공통 스타일을 적용할지 결정한다.
const orientation = ref("vertical");

watch(logoSrc, () => {
  hasLoadError.value = false;
  orientation.value = "vertical";
});

function handleLoad(event) {
  const { naturalWidth, naturalHeight } = event.target;
  orientation.value = naturalWidth > naturalHeight ? "horizontal" : "vertical";
}

function handleError() {
  hasLoadError.value = true;
}
</script>

<template>
  <span
    class="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface"
  >
    <img
      v-if="logoSrc && !hasLoadError"
      :src="logoSrc"
      :alt="altText"
      :class="orientation === 'horizontal' ? HORIZONTAL_LOGO_CLASS : VERTICAL_LOGO_CLASS"
      @load="handleLoad"
      @error="handleError"
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
