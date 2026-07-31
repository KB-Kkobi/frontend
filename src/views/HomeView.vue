<script setup>
import { ref } from "vue";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";

const isBuyConfirmOpen = ref(false);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <h1 class="text-h1 text-ink">홈</h1>
      <BackButton />

      <BaseCard color="pink">
        <h2 class="text-h2 text-ink">제목 텍스트 예시</h2>
        <div>요소들의</div>
        <div>배경 카드의</div>
        <div>예시입니다</div>
      </BaseCard>

      <div class="flex gap-2">
        <BottomButton color="pink" @click="isBuyConfirmOpen = true">
          매수 (꼭 눌러보세요)
        </BottomButton>
        <BottomButton color="blue" @click="confirm">매도</BottomButton>
      </div>

      <div><BottomButton color="yellow">예시 버튼입니다</BottomButton></div>
    </div>

    <BaseModal
      v-model="isBuyConfirmOpen"
      message="정말로 매수하시겠습니까?"
      confirm-color="pink"
    />
  </PageContainer>
</template>
