<script setup>
import BaseCard from "@/components/common/BaseCard.vue";

defineProps({
  firstReason: {
    type: String,
    default: "",
  },
  secondReason: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-navy">왜 이렇게 배분했을까요?</h2>
        <p class="text-caption text-muted tracking-tight">
          성향에 맞춰 자산마다 다른 역할을 담았어요.
        </p>
      </div>

      <div class="border-t border-line-soft" />

      <div class="flex flex-col gap-4">
        <p v-if="firstReason" class="text-body text-ink tracking-tight">
          {{ firstReason }}
        </p>

        <p v-if="secondReason" class="text-body text-ink tracking-tight">
          {{ secondReason }}
        </p>
      </div>
    </div>
  </BaseCard>
</template>
