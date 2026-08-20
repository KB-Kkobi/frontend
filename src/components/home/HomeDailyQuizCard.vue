<script setup>
import { computed, onMounted, ref } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import { fetchTodayQuiz, submitQuizAnswer, QuizApiError } from "@/api/quizApi";
import { formatCurrency } from "@/utils/format";

const isLoading = ref(true);
const errorMessage = ref("");
const quiz = ref(null);

const isSubmitting = ref(false);
const submitError = ref("");
const result = ref(null);

const displayResult = computed(() => {
  if (result.value) return result.value;
  if (quiz.value?.hasParticipatedToday && quiz.value.answer) {
    return { answer: quiz.value.answer, explanation: quiz.value.explanation };
  }
  return null;
});

const hasNoAccount = computed(
  () =>
    !!quiz.value &&
    quiz.value.hasQuizToday &&
    !quiz.value.hasParticipatedToday &&
    !quiz.value.canParticipate,
);

async function loadTodayQuiz() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    quiz.value = await fetchTodayQuiz();
  } catch (error) {
    errorMessage.value =
      error instanceof QuizApiError ? error.message : "퀴즈를 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
}

async function handleAnswer(answer) {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  submitError.value = "";

  try {
    result.value = await submitQuizAnswer(answer);
  } catch (error) {
    submitError.value =
      error instanceof QuizApiError ? error.message : "제출하지 못했습니다.";
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(loadTodayQuiz);
</script>

<template>
  <BaseCard v-if="isLoading" color="white">
    <div class="flex flex-col gap-2" role="status">
      <h2 class="text-h2 text-ink">오늘의 퀴즈를 불러오는 중이에요</h2>
      <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
    </div>
  </BaseCard>

  <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
    <div class="flex flex-col gap-2" role="alert">
      <h2 class="text-h2 text-ink">퀴즈를 불러오지 못했어요</h2>
      <p class="text-caption text-muted">{{ errorMessage }}</p>
    </div>
  </BaseCard>

  <BaseCard v-else-if="quiz && quiz.hasQuizToday && !hasNoAccount" color="white">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <h2 class="text-h2 text-ink">오늘의 금융 퀴즈</h2>
        <BasePill :label="quiz.category" variant="ghost" />
      </div>

      <p class="text-body text-ink">{{ quiz.question }}</p>

      <template v-if="displayResult">
        <div class="flex flex-col gap-2">
          <p
            v-if="result"
            :class="result.correct ? 'text-success' : 'text-error'"
            class="text-h2 font-bold"
          >
            {{ result.correct ? "정답이에요! 🎉" : "아쉬워요, 오답이에요" }}
          </p>
          <p class="text-caption text-muted">정답: {{ displayResult.answer }}</p>
          <p class="text-body text-ink">{{ displayResult.explanation }}</p>
        </div>

        <p v-if="result && result.correct" class="text-caption text-muted">
          가상 투자금 {{ formatCurrency(result.rewardAmount) }}이 적립됐어요
        </p>
      </template>

      <template v-else>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="rounded-2xl border border-blue-soft bg-white py-3 text-button font-semibold text-blue disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSubmitting"
            @click="handleAnswer('O')"
          >
            O
          </button>
          <button
            type="button"
            class="rounded-2xl border border-pink-soft bg-white py-3 text-button font-semibold text-pink disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSubmitting"
            @click="handleAnswer('X')"
          >
            X
          </button>
        </div>

        <p v-if="submitError" class="text-caption text-error" role="alert">
          {{ submitError }}
        </p>
      </template>
    </div>
  </BaseCard>
</template>