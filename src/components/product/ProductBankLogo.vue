<script setup>
import { computed, ref, watch } from "vue";
import { bankLogoMap } from "@/assets/banks/bankLogoMap";
import { getTrimmedLogoSrc } from "@/utils/trimLogoPadding";

const props = defineProps({
  name: {
    type: String,
    default: "",
  },
});

// 가로형 CI와 세로형/정사각형 심볼 두 가지만 구분한다. 은행별 개별 px 값은 두지 않는다.
// 두 유형 모두 높이(h-10)는 카드 행 높이에 맞춰 동일하게 유지하고, 가로형에만
// 더 넓은 폭(w-16)을 허용한다.
const HORIZONTAL_LOGO_CLASS = "h-10 w-16 object-contain";
const VERTICAL_LOGO_CLASS = "h-10 w-10 object-contain";

const rawLogoSrc = computed(() => bankLogoMap[props.name.trim()] ?? null);
const altText = computed(() =>
  props.name.trim() ? `${props.name.trim()} 로고` : "은행 로고",
);

// 실제로 표시할 이미지. 원본 asset의 투명 여백을 잘라낸 버전으로 대체된다.
const displaySrc = ref(null);
// asset 파일이 손상되었거나 형식이 잘못된 경우에도 깨진 이미지 아이콘 대신
// 기본 금융기관 아이콘으로 대체한다.
const hasLoadError = ref(false);
// 여백을 잘라낸 뒤의 실제 콘텐츠 비율에 따라 가로형/세로형 중 어느 공통
// 스타일을 적용할지 결정한다.
const orientation = ref("vertical");
// 실제 로고가 표시될 때는 배경을 비워, 투명 배경(누끼) PNG에 배경색이 비치지 않게 한다.
const isShowingLogo = computed(() => Boolean(displaySrc.value) && !hasLoadError.value);

watch(
  rawLogoSrc,
  (src) => {
    displaySrc.value = null;
    hasLoadError.value = false;
    orientation.value = "vertical";
    if (!src) return;

    getTrimmedLogoSrc(src)
      .then((trimmedSrc) => {
        if (rawLogoSrc.value !== src) return; // 그 사이 은행이 바뀐 경우 무시
        displaySrc.value = trimmedSrc;
      })
      .catch(() => {
        if (rawLogoSrc.value !== src) return;
        hasLoadError.value = true;
      });
  },
  { immediate: true },
);

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
    class="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
    :class="isShowingLogo ? '' : 'bg-surface'"
  >
    <img
      v-if="isShowingLogo"
      :src="displaySrc"
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
