<script setup>
import BaseAlertIcon from '@/components/common/BaseAlertIcon.vue';
import BaseCard from '@/components/common/BaseCard.vue';
import BasePill from '@/components/common/BasePill.vue';
import BottomButton from '@/components/common/BottomButton.vue';
import PageContainer from '@/components/common/PageContainer.vue';
import MarketLineChart from '@/components/game/MarketLineChart.vue';
import { GAME_INTRO_PREVIEW_PRICES, GAME_INTRO_STEPS } from '@/constants/game';

const previewPriceMin = Math.min(...GAME_INTRO_PREVIEW_PRICES);
const previewPriceMax = Math.max(...GAME_INTRO_PREVIEW_PRICES);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="flex flex-col gap-2">
        <p class="text-caption text-muted">회원님, 반가워요</p>
        <h1 class="text-amount text-ink">
          3분만 직접<br />
          투자해볼까요?
        </h1>
        <p class="text-body text-muted">
          주식이
          <strong class="font-semibold text-ink">실시간으로 오르내리는 3분</strong>
          동안<br />
          당신의 선택으로 성향을 알아봐요.
        </p>
      </header>

      <BaseCard>
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <h2 class="text-h2 text-ink">시장종합지수</h2>
                <BasePill label="미리보기" color="yellow" />
              </div>
              <p class="text-caption text-muted">
                종목 A 가격은 이 지수를 그대로 따라가요
              </p>
            </div>
            <BasePill label="8개월차" color="pink" variant="outline" />
          </div>

          <div class="text-blue" aria-label="시장종합지수 예시 차트">
            <MarketLineChart
              :prices="GAME_INTRO_PREVIEW_PRICES"
              :total-ticks="GAME_INTRO_PREVIEW_PRICES.length"
              :price-min="previewPriceMin"
              :price-max="previewPriceMax"
            />
          </div>

          <p class="text-caption text-muted">
            시장 상황을 살펴보고 매수·매도·예금 해지를 직접 선택해요.
          </p>

          <div class="flex gap-2" aria-label="게임 행동 버튼 예시">
            <BottomButton color="pink">매수</BottomButton>
            <BottomButton color="blue">매도</BottomButton>
            <BottomButton color="white">예금 해지</BottomButton>
          </div>
        </div>
      </BaseCard>

      <section class="flex flex-col gap-4" aria-labelledby="game-rule-title">
        <h2 id="game-rule-title" class="text-h2 text-ink">
          게임은 이렇게 진행돼요
        </h2>

        <BaseCard color="yellow">
          <ol class="flex flex-col gap-4">
            <li
              v-for="(step, index) in GAME_INTRO_STEPS"
              :key="step.title"
              class="flex items-start gap-4"
            >
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow text-caption font-bold text-ink"
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

      <BaseCard color="pink">
        <div class="flex items-start gap-4">
          <BaseAlertIcon class="h-6 w-6 shrink-0 text-pink" />
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">시작하기 전에 확인해 주세요</h2>
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

      <BottomButton color="yellow">시작 자산 정하기</BottomButton>
    </div>
  </PageContainer>
</template>
