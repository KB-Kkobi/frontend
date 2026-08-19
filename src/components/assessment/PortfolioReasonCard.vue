<script setup>
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";

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
        <div v-if="firstReason" class="flex flex-col items-start gap-2">
          <BasePill label="주식 배분" color="pink" variant="filled" />
          <p class="text-body text-ink tracking-tight">
            {{ firstReason }}
          </p>
        </div>

        <div
          v-if="firstReason && secondReason"
          class="border-t border-dashed border-line-soft"
        />

        <div v-if="secondReason" class="flex flex-col items-start gap-2">
          <BasePill label="채권·예적금 배분" color="blue" variant="filled" />
          <p class="text-body text-ink tracking-tight">
            {{ secondReason }}
          </p>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
