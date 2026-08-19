<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  prefix: {
    type: String,
    default: "",
  },
  highlight: {
    type: String,
    default: "",
  },
  suffix: {
    type: String,
    default: "",
  },
  summary: {
    type: String,
    default: "",
  },
});

const normalizedPrefix = computed(() => props.prefix.trimEnd());
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-navy">왜 이런 성향이 나왔을까요?</h2>
        <p class="text-caption text-muted tracking-tight">
          게임에서 보여준 선택을 바탕으로 분석했어요.
        </p>
      </div>

      <div class="border-t border-line-soft" />

      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2 text-pink">
          <svg
            class="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" stroke-width="2" />
            <path
              d="m14.5 14.5 4.5 4.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="m8.25 10.5 1.5 1.5 3-3.25"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="text-body font-semibold tracking-tight">{{ title }}</p>
        </div>

        <div>
          <p class="text-body text-ink tracking-tight">
            <span>{{ normalizedPrefix }}</span>{{ " " }}<strong class="font-semibold">{{
              highlight
            }}</strong
            >{{ suffix }}{{ " " }}{{ summary }}
          </p>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
