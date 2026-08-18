<script setup>
import { onMounted, ref } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import HomePersonaSummaryCard from "@/components/home/HomePersonaSummaryCard.vue";
import HomeAssessmentIntroCard from "@/components/home/HomeAssessmentIntroCard.vue";
import HomeDailyQuizCard from "@/components/home/HomeDailyQuizCard.vue";
import NotificationBellButton from "@/components/notification/NotificationBellButton.vue";
import { fetchMyInfo } from "@/api/authApi";
import { fetchAssessmentResult } from "@/api/assessmentApi";
import { ApiError } from "@/api/http";

const nickname = ref("");
const assessmentResult = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");

async function loadHomeData() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [myInfo, result] = await Promise.all([fetchMyInfo(), fetchAssessmentResult()]);
    nickname.value = myInfo.nickname;
    assessmentResult.value = result;
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : "홈 정보를 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadHomeData);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <PageHeader>
        <template #actions>
          <NotificationBellButton />
        </template>
        <h1 class="text-h1 text-ink">
          안녕하세요<span v-if="nickname">, {{ nickname }}님</span>! 👋
        </h1>
        <p class="text-caption text-muted">오늘도 현명한 투자를 응원해요! 💛</p>
      </PageHeader>

      <BaseCard v-if="isLoading" color="white">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">홈 정보를 불러오는 중이에요</h2>
          <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
        </div>
      </BaseCard>

      <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
        <div class="flex flex-col gap-2" role="alert">
          <h2 class="text-h2 text-ink">정보를 불러오지 못했어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
      </BaseCard>

      <HomePersonaSummaryCard
        v-else-if="assessmentResult"
        :persona-name="assessmentResult.persona.personaName"
        :description="assessmentResult.persona.description"
        :image-path="assessmentResult.persona.imagePath"
        :scores="{
          rtScore: assessmentResult.rtScore,
          lhScore: assessmentResult.lhScore,
          rpScore: assessmentResult.rpScore,
        }"
        :stock-ratio="assessmentResult.persona.stockRatio"
        :bond-ratio="assessmentResult.persona.bondRatio"
        :deposit-ratio="assessmentResult.persona.depositRatio"
      />

      <HomeAssessmentIntroCard v-else />

      <HomeDailyQuizCard v-if="!isLoading && !errorMessage" />
    </div>
  </PageContainer>
</template>
