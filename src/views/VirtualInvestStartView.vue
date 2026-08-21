<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { AccountApiError, createAccount } from "@/api/accountApi";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import { INITIAL_SEED_MONEY } from "@/constants/account";
import { formatCurrency } from "@/utils/format";

const CONFIRM_MESSAGE = "가상투자를 시작할까요?";

const router = useRouter();

const isSubmitting = ref(false);
const errorMessage = ref("");
const isConfirmVisible = ref(false);

function handleOpenConfirm() {
  if (isSubmitting.value) return;
  isConfirmVisible.value = true;
}

async function handleSubmit() {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    await createAccount();
    await router.replace({
      name: "virtual-assets",
      query: { started: "true" },
    });
  } catch (error) {
    if (error instanceof AccountApiError && error.status === 401) {
      errorMessage.value = "로그인 후 가상투자를 시작할 수 있어요.";
    } else if (error instanceof AccountApiError) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value =
        "계좌를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <div class="flex flex-col gap-2">
        <h1 class="flex flex-col gap-2 text-h1 text-ink">
          <span>부담 없이 연습할 수 있도록,</span>
          <span class="text-pink">초기 자산을 드려요</span>
        </h1>
        <p class="text-caption text-muted">
          따로 설정할 내용은 없어요. 바로 가상투자를 시작할 수 있습니다.
        </p>
      </div>

      <BaseCard color="white" elevation="highlight">
        <div class="flex flex-col items-center gap-2 text-center">
          <p class="text-caption text-muted">초기 투자금</p>
          <strong class="text-amount text-navy tabular-nums">
            {{ formatCurrency(INITIAL_SEED_MONEY) }}
          </strong>
          <p class="text-caption text-muted">
            모든 사용자에게 동일하게 지급돼요
          </p>
        </div>
      </BaseCard>

      <BaseCard color="blue">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">실제 돈은 사용되지 않아요</h2>
          <p class="text-caption text-muted">
            지급된 가상 자산으로 실제 상품 정보를 보며 투자 감각을 익히는
            연습 계좌예요.
          </p>
        </div>
      </BaseCard>

      <p v-if="errorMessage" class="text-caption text-error" role="alert">
        {{ errorMessage }}
      </p>

      <BottomButton color="pink" :disabled="isSubmitting" @click="handleOpenConfirm">
        {{ isSubmitting ? "계좌를 만드는 중이에요" : "가상투자 시작하기" }}
      </BottomButton>
    </div>

    <!-- 가상투자 시작 확인 모달 -->
    <BaseModal
      v-model="isConfirmVisible"
      :message="CONFIRM_MESSAGE"
      confirm-text="시작하기"
      cancel-text="취소"
      @confirm="handleSubmit"
    >
      <template #content>
        <div class="flex flex-col gap-2 text-center text-caption text-muted tracking-tight">
          <p>500만 원의 가상 자산이 연습 계좌에 지급돼요.</p>
          <p>실제 돈은 사용되지 않아요.</p>
        </div>
      </template>
    </BaseModal>
  </PageContainer>
</template>
