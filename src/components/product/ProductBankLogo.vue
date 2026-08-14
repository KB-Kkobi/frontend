<script setup>
import { computed } from "vue";

const props = defineProps({
  name: {
    type: String,
    default: "",
  },
});

// pink-soft는 반복 카드 배경으로 쓰지 않으므로 은행 배지 팔레트에서 제외한다.
const COLOR_KEYS = ["blue", "green", "yellow", "lavender", "cream"];

const BG_CLASSES = {
  blue: "bg-blue-soft",
  green: "bg-green-soft",
  yellow: "bg-yellow-soft",
  lavender: "bg-lavender-soft",
  cream: "bg-cream-soft",
};

const TEXT_CLASSES = {
  blue: "text-blue",
  green: "text-green",
  yellow: "text-yellow",
  lavender: "text-lavender",
  cream: "text-cream",
};

function pickColorKey(name) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % COLOR_KEYS.length;
  }
  return COLOR_KEYS[hash];
}

// "주식회사 케이뱅크"처럼 법인 형태 접두어만 다르고 실제 은행명이 뒤에 오는
// 경우 이니셜이 전부 "주"로 겹치므로 접두어를 제거한 이름을 기준으로 삼는다.
const displayName = computed(() =>
  props.name.trim().replace(/^주식회사\s*/, ""),
);

const colorKey = computed(() => pickColorKey(displayName.value));
const initial = computed(() => displayName.value.charAt(0) || "금");
</script>

<template>
  <span
    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body font-semibold"
    :class="[BG_CLASSES[colorKey], TEXT_CLASSES[colorKey]]"
    aria-hidden="true"
  >
    {{ initial }}
  </span>
</template>
