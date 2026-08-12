<script setup>
import { useRouter } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import { HOME_INTRO_FEATURES } from "@/constants/home";

const router = useRouter();

function handleStartGame() {
  router.push({ name: "game-introduction" });
}
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-h1 text-ink">
          지금 바로<br />
          <span class="text-pink font-bold">투자 성향 분석</span> 시작하기
        </h2>
        <p class="text-caption text-muted">
          약 3분 동안 간단한 게임을 통해 나의 투자 성향을 분석해드려요!
        </p>
      </div>

      <ul class="grid grid-cols-3 gap-2">
        <li
          v-for="feature in HOME_INTRO_FEATURES"
          :key="feature.key"
          class="flex flex-col items-center gap-2 rounded-2xl bg-surface p-3 text-center"
        >
          <span class="text-pink" aria-hidden="true">
            <svg
              v-if="feature.icon === 'assessment'"
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.75" />
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.75" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>

            <svg
              v-else-if="feature.icon === 'portfolio'"
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 7H19L18 20.5C17.9 21.35 17.2 22 16.3 22H7.7C6.8 22 6.1 21.35 6 20.5L5 7Z"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M8 7V5C8 2.79 9.79 1 12 1C14.21 1 16 2.79 16 5V7"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <svg
              v-else
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="13" width="4" height="8" rx="1" fill="currentColor" />
              <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" />
              <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" />
            </svg>
          </span>

          <span class="whitespace-pre-line break-keep text-caption text-ink">{{ feature.label }}</span>
        </li>
      </ul>

      <BottomButton color="pink" @click="handleStartGame">
        성향 분석 게임 시작하기
      </BottomButton>
    </div>
  </BaseCard>
</template>