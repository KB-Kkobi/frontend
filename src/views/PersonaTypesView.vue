<script setup>
import { ref, onMounted } from "vue";
import PageContainer from "@/components/common/PageContainer.vue";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import PersonaTypeCard from "@/components/assessment/PersonaTypeCard.vue";
import { fetchPersonas } from "@/api/personaApi";
import { ApiError } from "@/api/http";

const SUBTITLE =
  "위험감수·유동성·기대수익 3가지 축의 조합으로 나뉘어요.\n카드를 눌러 강점과 주의점을 확인해보세요.";

const personas = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");

async function loadPersonas() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    personas.value = await fetchPersonas();
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : "투자 성향 유형을 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadPersonas);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <div class="flex items-center gap-2">
        <BackButton />
        <h1 class="text-h1 text-ink">성향 진단 리포트</h1>
      </div>

      <div class="flex flex-col gap-2">
        <h2 class="text-h1 font-bold text-navy">8가지 투자 성향</h2>
        <p class="whitespace-pre-line text-caption text-muted">{{ SUBTITLE }}</p>
      </div>

      <BaseCard v-if="isLoading" color="white">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">투자 성향 유형을 불러오는 중이에요</h2>
          <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
        </div>
      </BaseCard>

      <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
        <div class="flex flex-col gap-2" role="alert">
          <h2 class="text-h2 text-ink">투자 성향 유형을 불러오지 못했어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
      </BaseCard>

      <div v-else class="flex flex-col gap-4">
        <PersonaTypeCard
          v-for="persona in personas"
          :key="persona.personaId"
          :persona-name="persona.personaName"
          :feature="persona.feature"
          :description="persona.description"
          :image-path="persona.imagePath"
          :axis-code="persona.axisCode"
          :strength="persona.strength"
          :caution="persona.caution"
        />
      </div>
    </div>
  </PageContainer>
</template>
