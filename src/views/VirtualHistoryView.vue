<script setup>
import { onMounted, ref } from "vue";
import { ApiError } from "@/api/http";
import { fetchProductHoldingHistory } from "@/api/productApi";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import TransactionCard from "@/components/transaction/TransactionCard.vue";
import {
  PRODUCT_TRANSACTION_TYPES,
  getProductTransactionLabel,
  getProductTypeLabel,
} from "@/constants/product";
import { formatLocalDateTime } from "@/utils/date";
import { formatCurrency } from "@/utils/format";

const history = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "예금·적금 거래 이력을 불러오지 못했습니다.";
}

function getTransactionColor(transactionType) {
  if (transactionType === PRODUCT_TRANSACTION_TYPES.TERMINATE) return "yellow";
  if (transactionType === PRODUCT_TRANSACTION_TYPES.SUBSCRIBE) return "green";
  return "blue";
}

async function loadHistory() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    history.value = await fetchProductHoldingHistory();
  } catch (error) {
    history.value = [];
    errorMessage.value = getErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadHistory);
</script>

<template>
  <div class="flex flex-col gap-4 pb-6">
    <div class="flex flex-col gap-2">
      <h2 class="text-h2 text-ink">예금·적금 거래 이력</h2>
      <p class="text-caption text-muted">가입과 납입, 해지 기록을 최신순으로 확인할 수 있어요.</p>
    </div>

    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">거래 이력을 불러오고 있어요</h2>
        <p class="text-caption text-muted">서버에 저장된 기록을 확인합니다.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="pink">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">거래 이력을 확인할 수 없어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadHistory">
          다시 시도하기
        </BottomButton>
      </div>
    </BaseCard>

    <div v-else-if="history.length" class="flex flex-col gap-4">
      <TransactionCard
        v-for="transaction in history"
        :key="transaction.productTransactionId"
        :name="transaction.productName"
        :sub-label="transaction.financialCompanyName"
        :pill="{
          label: getProductTransactionLabel(
            transaction.transactionType,
            transaction.productType,
          ),
          color: getTransactionColor(transaction.transactionType),
        }"
        :datetime="formatLocalDateTime(transaction.processedAt)"
        :stats="[
          {
            label: '상품 유형',
            value: getProductTypeLabel(transaction.productType),
          },
          { label: '처리 금액', value: formatCurrency(transaction.amount) },
        ]"
      />
    </div>

    <BaseCard v-else color="yellow">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">아직 예금·적금 거래가 없어요</h2>
        <p class="text-caption text-muted">
          상품에 가입하거나 해지하면 서버에 저장된 이력이 여기에 표시됩니다.
        </p>
      </div>
    </BaseCard>
  </div>
</template>
