<script setup>
import { useRouter } from 'vue-router';
import BackButton from '@/components/common/BackButton.vue';
import BaseAlertIcon from '@/components/common/BaseAlertIcon.vue';
import BaseCard from '@/components/common/BaseCard.vue';
import BottomButton from '@/components/common/BottomButton.vue';
import PageContainer from '@/components/common/PageContainer.vue';
import { GAME_INTRO_STEPS } from '@/constants/game';

const router = useRouter();

function handleOpenAllocation() {
  router.push({ name: 'game-allocation' });
}
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="flex flex-col gap-4">
        <BackButton />
        <h1 class="text-amount text-ink">이제 게임을 시작해요</h1>
        <p class="text-body text-muted">
          진행 방식과 주의사항을 확인해 주세요.
        </p>
      </header>

      <section class="flex flex-col gap-4" aria-labelledby="game-rule-title">
        <h2 id="game-rule-title" class="text-h2 text-ink">
          게임은 이렇게 진행돼요
        </h2>

        <BaseCard color="white" elevation="flat">
          <ol class="flex flex-col gap-4">
            <li
              v-for="(step, index) in GAME_INTRO_STEPS"
              :key="step.title"
              class="flex items-start gap-4"
            >
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-pink text-caption font-bold text-white"
              >
                {{ index + 1 }}
              </span>
              <div class="flex flex-col gap-2">
                <h3 class="text-h2 text-ink">{{ step.title }}</h3>
                <p class="text-caption text-muted">{{ step.description }}</p>
              </div>
            </li>
          </ol>
        </BaseCard>
      </section>

      <BaseCard color="yellow">
        <div class="flex items-start gap-4">
          <BaseAlertIcon class="h-6 w-6 shrink-0 text-yellow" />
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-navy">시작하기 전에 확인해 주세요</h2>
            <p class="text-caption text-ink">
              게임 결과는 상품 추천과 가상투자 서비스의 기준으로 사용돼요.
              신중하게 선택해 주세요.
            </p>
            <p class="text-caption font-semibold text-error">
              진단은 한 번만 가능하며, 완료 후에는 다시 진행할 수 없어요.
            </p>
            <p class="text-caption text-muted">
              게임을 완료하지 않으면 상품 추천과 가상투자 서비스를 이용할 수
              없어요.
            </p>
          </div>
        </div>
      </BaseCard>

      <BottomButton color="pink" @click="handleOpenAllocation">
        시작 자산 정하기
      </BottomButton>
    </div>
  </PageContainer>
</template>