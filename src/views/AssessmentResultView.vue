<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import PageContainer from "@/components/common/PageContainer.vue";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PersonaSummaryCard from "@/components/assessment/PersonaSummaryCard.vue";
import StrengthCautionCard from "@/components/assessment/StrengthCautionCard.vue";
import AxisScoreCard from "@/components/assessment/AxisScoreCard.vue";
import RecommendedPortfolioCard from "@/components/assessment/RecommendedPortfolioCard.vue";
import { fetchAssessmentResult } from "@/api/assessmentApi";
import { ApiError } from "@/api/http";

const router = useRouter();

const result = ref(null);
const isLoading = ref(true);
const hasNoAssessment = ref(false);
const errorMessage = ref("");

async function loadAssessmentResult() {
  isLoading.value = true;
  hasNoAssessment.value = false;
  errorMessage.value = "";

  try {
    result.value = await fetchAssessmentResult();
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      hasNoAssessment.value = true;
    } else {
      errorMessage.value =
        error instanceof ApiError ? error.message : "진단 결과를 불러오지 못했습니다.";
    }
  } finally {
    isLoading.value = false;
  }
}

function handleStartGame() {
  router.push({ name: "game-introduction" });
}

function handleRecommendProducts() {
  router.push({ name: "products" });
}

onMounted(loadAssessmentResult);
</script>

<template>
  <PageContainer background="page-warm">
    <div class="flex flex-col gap-6 py-6">
      <div class="flex items-center gap-2">
        <BackButton />
        <h1 class="text-h1 text-ink">성향 진단 리포트</h1>
      </div>

      <BaseCard v-if="isLoading" color="white">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">진단 결과를 불러오는 중이에요</h2>
          <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
        </div>
      </BaseCard>

      <BaseCard v-else-if="hasNoAssessment" color="yellow">
        <div class="flex flex-col gap-4" role="status">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">아직 진단 이력이 없어요</h2>
            <p class="text-caption text-muted">
              게임을 완료하면 나만의 투자 성향 리포트를 확인할 수 있어요.
            </p>
          </div>
          <BottomButton color="pink" @click="handleStartGame">
            게임 시작하러 가기
          </BottomButton>
        </div>
      </BaseCard>

      <BaseCard v-else-if="errorMessage" color="pink">
        <div class="flex flex-col gap-2" role="alert">
          <h2 class="text-h2 text-ink">진단 결과를 불러오지 못했어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
      </BaseCard>

      <template v-else-if="result">
        <PersonaSummaryCard
          :feature="result.persona.feature"
          :persona-name="result.persona.personaName"
          :description="result.persona.description"
          :image-path="result.persona.imagePath"
          :scores="{
            rtScore: result.rtScore,
            lhScore: result.lhScore,
            rpScore: result.rpScore,
          }"
        />

        <StrengthCautionCard
          :strength="result.persona.strength"
          :caution="result.persona.caution"
        />

        <AxisScoreCard
          :scores="{
            rtScore: result.rtScore,
            lhScore: result.lhScore,
            rpScore: result.rpScore,
          }"
        />

        <RecommendedPortfolioCard
          :persona-name="result.persona.personaName"
          :feature="result.persona.feature"
          :stock-ratio="result.persona.stockRatio"
          :bond-ratio="result.persona.bondRatio"
          :deposit-ratio="result.persona.depositRatio"
        />

        <div class="flex flex-col items-center gap-4">
          <span class="text-caption text-muted">다른 유형도 궁금하다면 8가지 유형 전체보기 &gt;</span>
          <BottomButton color="pink" shape="pill" @click="handleRecommendProducts">
            내 성향 상품 추천받기
          </BottomButton>
        </div>
      </template>
    </div>
  </PageContainer>
</template>
