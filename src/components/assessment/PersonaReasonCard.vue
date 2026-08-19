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
        <p class="text-body font-bold text-pink tracking-tight">{{ title }}</p>

        <p class="text-body text-ink tracking-tight">
          <span>{{ normalizedPrefix }}</span>{{ " " }}<strong class="font-bold">{{ highlight }}</strong
          >{{ suffix }}
        </p>

        <p class="text-body text-ink tracking-tight">{{ summary }}</p>
      </div>
    </div>
  </BaseCard>
</template>
