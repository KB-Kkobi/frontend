<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "@/api/http";
import { fetchHoldings } from "@/api/trade";
import { PRODUCT_LIST_TABS } from "@/constants/product";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BasePill from "@/components/common/BasePill.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import StockHoldingRow from "@/components/virtual/StockHoldingRow.vue";

const router = useRouter();

const holdings = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "보유 주식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

async function loadHoldings() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchHoldings();
    holdings.value = Array.isArray(response?.holdings)
      ? response.holdings
      : Array.isArray(response)
        ? response
        : [];
  } catch (error) {
    holdings.value = [];
    errorMessage.value = getErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

function handleBrowseProducts() {
  router.push({
    name: "virtual-products",
    query: { tab: PRODUCT_LIST_TABS.SECURITY },
  });
}

function handleSelectHolding(holding) {
  if (!holding.ticker) return;
  router.push({
    name: "security-detail",
    params: { pk: holding.ticker },
    query: { tradable: "true" },
  });
}

onMounted(loadHoldings);
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-center gap-2">
      <BackButton />
      <div class="flex flex-col gap-2">
        <h1 class="text-h1 text-ink">보유 주식</h1>
        <p class="text-caption text-muted">보유 중인 주식 종목을 확인해 보세요.</p>
      </div>
    </header>

    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">보유 주식을 불러오는 중이에요</h2>
        <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="white" elevation="flat">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">보유 주식을 불러오지 못했어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadHoldings">다시 시도하기</BottomButton>
      </div>
    </BaseCard>

    <template v-else-if="holdings.length">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-h2 text-ink">보유 주식</h2>
        <p class="text-caption text-muted tabular-nums">총 {{ holdings.length }}개</p>
      </div>

      <div class="flex flex-col gap-4">
        <div
          v-for="holding in holdings"
          :key="holding.securityId ?? holding.ticker"
          role="button"
          tabindex="0"
          @click="handleSelectHolding(holding)"
          @keydown.enter.prevent="handleSelectHolding(holding)"
          @keydown.space.prevent="handleSelectHolding(holding)"
        >
          <BaseCard color="white" elevation="flat">
            <StockHoldingRow :holding="holding" />
          </BaseCard>
        </div>
      </div>
    </template>

    <BaseCard v-else color="white" elevation="flat">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <p class="text-body text-ink tracking-tight">보유 중인 주식이 없어요</p>
          <p class="text-caption text-muted tracking-tight">첫 투자를 시작해보세요.</p>
        </div>
        <BasePill as="button" label="상품 보기" color="pink" variant="outline" @click="handleBrowseProducts" />
      </div>
    </BaseCard>
  </div>
</template>
