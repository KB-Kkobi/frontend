<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchMyInfo } from '@/api/authApi';
import { fetchGameStatus } from '@/api/gameApi';
import { ApiError } from '@/api/http';
import BackButton from '@/components/common/BackButton.vue';
import BaseAlertIcon from '@/components/common/BaseAlertIcon.vue';
import BaseCard from '@/components/common/BaseCard.vue';
import BasePill from '@/components/common/BasePill.vue';
import BottomButton from '@/components/common/BottomButton.vue';
import PageContainer from '@/components/common/PageContainer.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import MarketLineChart from '@/components/game/MarketLineChart.vue';
import { GAME_INTRO_PREVIEW_PRICES } from '@/constants/game';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isLoading = ref(true);
const errorMessage = ref('');
const nickname = ref('');

const previewPriceMin = Math.min(...GAME_INTRO_PREVIEW_PRICES);
const previewPriceMax = Math.max(...GAME_INTRO_PREVIEW_PRICES);

function getGameStatusErrorMessage(error) {
  if (!(error instanceof ApiError)) {
    return '게임 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (error.status === 0) return '서버에 연결할 수 없습니다.';

  return error.message || '게임 정보를 확인하지 못했습니다.';
}

async function redirectToLogin() {
  await router.replace({
    name: 'login',
    query: { redirect: route.fullPath },
  });
}

async function loadGameStatus() {
  if (!authStore.isAuthenticated) {
    await redirectToLogin();
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const [gameStatus, myInfo] = await Promise.all([
      fetchGameStatus(),
      fetchMyInfo(),
    ]);
    if (gameStatus?.isCompleted) {
      await router.replace({ name: 'home' });
      return;
    }
    nickname.value = myInfo?.nickname ?? '';
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      authStore.logout();
      await redirectToLogin();
      return;
    }

    errorMessage.value = getGameStatusErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

function handleGoHome() {
  router.replace({ name: 'home' });
}

function handleOpenTutorial() {
  router.push({ name: 'game-tutorial' });
}

function handleBrowseProducts() {
  router.push({ name: 'products' });
}

onMounted(loadGameStatus);
</script>

<template>
  <PageContainer>
    <div
      v-if="isLoading"
      class="flex flex-1 items-center justify-center py-6"
      role="status"
      aria-live="polite"
    >
      <BaseCard>
        <p class="text-body text-muted">게임 정보를 확인하고 있어요.</p>
      </BaseCard>
    </div>

    <div
      v-else-if="errorMessage"
      class="flex flex-1 items-center justify-center py-6"
      role="alert"
    >
      <BaseCard color="white" elevation="flat">
        <div class="flex flex-col gap-4">
          <div class="flex items-start gap-4">
            <BaseAlertIcon class="h-6 w-6 shrink-0 text-error" />
            <div class="flex flex-col gap-2">
              <h1 class="text-h1 text-ink">게임 정보를 불러오지 못했어요</h1>
              <p class="text-body text-muted">{{ errorMessage }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <BottomButton color="yellow" @click="loadGameStatus">
              다시 시도
            </BottomButton>
            <BottomButton color="white" @click="handleGoHome">
              홈으로 돌아가기
            </BottomButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <div v-else class="flex flex-col gap-6 py-6">
      <div>
        <BackButton />
      </div>

      <PageHeader>
        <p class="text-caption text-muted">
          <strong class="font-semibold text-navy">
            {{ nickname ? nickname : '회원' }}
          </strong>
          님, 반가워요
        </p>
        <h1 class="text-amount text-ink">3분만 직접 투자해볼까요?</h1>
        <p class="text-caption text-muted tracking-tight">
          주식이
          <strong class="font-semibold text-navy"
            >실시간으로 오르내리는 3분</strong
          >
          동안<br />당신의 선택으로 성향을 알아봐요.
        </p>
      </PageHeader>

      <BaseCard color="white" elevation="highlight">
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <h2 class="text-h2 text-ink">시장종합지수</h2>
              </div>
              <p class="text-caption text-muted">
                종목 A 가격은 이 지수를 그대로 따라가요
              </p>
            </div>
            <BasePill label="미리보기" color="pink" />
          </div>

          <div class="text-pink" aria-label="시장종합지수 예시 차트">
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

      <p class="text-center text-caption text-muted">
        본 게임 전에 조작법을 익혀볼게요
      </p>
      <BottomButton color="pink" @click="handleOpenTutorial">
        튜토리얼 시작하기
      </BottomButton>
      <BottomButton color="white" @click="handleBrowseProducts">
        상품 먼저 둘러보기
      </BottomButton>
    </div>
  </PageContainer>
</template>
