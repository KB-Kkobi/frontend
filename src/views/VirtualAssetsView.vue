<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  AccountApiError,
  fetchAccountAssetStatus,
} from "@/api/accountApi";
import { ApiError } from "@/api/http";
import { fetchProductHoldings } from "@/api/productApi";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import ProductHoldingCard from "@/components/product/ProductHoldingCard.vue";
import {
  formatCurrency,
  formatRate,
  formatSignedCurrency,
} from "@/utils/format";

const route = useRoute();
const router = useRouter();

const account = ref(null);
const holdings = ref([]);
const isLoading = ref(false);
const isAccountMissing = ref(false);
const errorMessage = ref("");

const hasJustStarted = computed(() => route.query.started === "true");
const hasJustSubscribed = computed(() => route.query.subscribed === "true");
const hasJustTerminated = computed(() => route.query.terminated === "true");
const profitColorClass = computed(() =>
  Number(account.value?.totalProfit) < 0 ? "text-loss" : "text-profit",
);

function getErrorMessage(error) {
  if (error instanceof ApiError || error instanceof AccountApiError) {
    if (error.status === 401 || error.status === 403) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "가상투자 자산 현황을 불러오지 못했습니다.";
}

async function loadAssets() {
  isLoading.value = true;
  isAccountMissing.value = false;
  errorMessage.value = "";
  account.value = null;
  holdings.value = [];

  try {
    const [accountResponse, holdingResponse] = await Promise.all([
      fetchAccountAssetStatus(),
      fetchProductHoldings(),
    ]);
    account.value = accountResponse;
    holdings.value = holdingResponse;
  } catch (error) {
    if (error instanceof AccountApiError && error.status === 400) {
      isAccountMissing.value = true;
    } else {
      errorMessage.value = getErrorMessage(error);
    }
  } finally {
    isLoading.value = false;
  }
}

function handleStart() {
  router.push({ name: "virtual-start" });
}

function handleBrowseProducts() {
  router.push({ name: "products" });
}

function handleSelectHolding(holding) {
  router.push({
    name: "product-holding-detail",
    params: { holdingProductId: holding.holdingProductId },
  });
}

function handleDismissSubscribedNotice() {
  const query = { ...route.query };
  delete query.subscribed;
  router.replace({ query });
}

onMounted(loadAssets);
</script>

<template>
  <div class="flex flex-col gap-6 pb-6">
    <BaseCard v-if="isLoading" color="blue">
      <div class="flex flex-col gap-2" role="status">
        <h2 class="text-h2 text-ink">가상투자 자산을 불러오고 있어요</h2>
        <p class="text-caption text-muted">계좌와 보유 상품의 최신 상태를 확인합니다.</p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="errorMessage" color="pink">
      <div class="flex flex-col gap-4" role="alert">
        <div class="flex flex-col gap-2">
          <h2 class="text-h2 text-ink">자산 현황을 확인할 수 없어요</h2>
          <p class="text-caption text-muted">{{ errorMessage }}</p>
        </div>
        <BottomButton color="white" @click="loadAssets">
          다시 시도하기
        </BottomButton>
      </div>
    </BaseCard>

    <template v-else-if="isAccountMissing">
      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <p class="text-caption font-semibold text-yellow">처음이신가요?</p>
            <h2 class="text-h2 text-ink">가상투자 계좌를 먼저 만들어 주세요</h2>
            <p class="text-caption text-muted">
              초기 자산과 매월 투자할 금액을 정하면 실제 데이터가 저장된 연습 계좌를 준비해 드려요.
            </p>
          </div>
          <BottomButton color="yellow" @click="handleStart">
            가상투자 시작하기
          </BottomButton>
        </div>
      </BaseCard>
    </template>

    <template v-else-if="account">
      <BaseCard v-if="hasJustStarted" color="green">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">가상투자 계좌가 만들어졌어요</h2>
          <p class="text-caption text-muted">입력한 초기 자산이 계좌에 반영됐습니다.</p>
        </div>
      </BaseCard>

      <BaseCard v-if="hasJustSubscribed" color="green">
        <div class="flex flex-col gap-4" role="status">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">상품 가입이 완료됐어요</h2>
            <p class="text-caption text-muted">
              사용 가능한 현금과 보유 예금·적금 목록을 서버에서 다시 불러왔습니다.
            </p>
          </div>
          <BottomButton color="green" @click="handleDismissSubscribedNotice">
            확인
          </BottomButton>
        </div>
      </BaseCard>

      <BaseCard v-if="hasJustTerminated" color="green">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">상품 해지가 완료됐어요</h2>
          <p class="text-caption text-muted">
            반환 금액과 변경된 자산 비중을 서버에서 다시 불러왔습니다.
          </p>
        </div>
      </BaseCard>

      <BaseCard color="blue">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-h2 text-ink">내 가상투자 계좌</h2>
            <span class="rounded-xl bg-blue px-pill-x py-pill-y text-caption font-semibold text-white">
              연습 계좌
            </span>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-caption text-muted">총 자산</span>
            <strong class="text-amount text-ink tabular-nums">
              {{ formatCurrency(account.totalAsset) }}
            </strong>
          </div>
          <div class="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div class="flex flex-col gap-2">
              <span class="text-caption text-muted">누적 손익</span>
              <strong :class="[profitColorClass, 'text-body tabular-nums']">
                {{ formatSignedCurrency(account.totalProfit) }}
              </strong>
            </div>
            <div class="flex flex-col gap-2 text-right">
              <span class="text-caption text-muted">수익률</span>
              <strong :class="[profitColorClass, 'text-body tabular-nums']">
                {{ formatRate(Number(account.totalReturnRate)) }}
              </strong>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">자산 구성</h2>
            <p class="text-caption text-muted">
              서버에 저장된 현금과 보유 자산을 기준으로 계산했어요.
            </p>
          </div>

          <dl class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-body text-muted">사용 가능한 현금</dt>
              <dd class="flex flex-col gap-2 text-right">
                <strong class="text-body text-ink tabular-nums">
                  {{ formatCurrency(account.cashBalance) }}
                </strong>
                <span class="text-caption text-muted tabular-nums">
                  {{ Number(account.cashRatio).toFixed(1) }}%
                </span>
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4 border-t border-line pt-4">
              <dt class="text-body text-muted">주식 자산</dt>
              <dd class="flex flex-col gap-2 text-right">
                <strong class="text-body text-ink tabular-nums">
                  {{ formatCurrency(account.stockAsset) }}
                </strong>
                <span class="text-caption text-muted tabular-nums">
                  {{ Number(account.stockRatio).toFixed(1) }}%
                </span>
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4 border-t border-line pt-4">
              <dt class="text-body text-muted">예금·적금 자산</dt>
              <dd class="flex flex-col gap-2 text-right">
                <strong class="text-body text-profit tabular-nums">
                  {{ formatCurrency(account.savingsAsset) }}
                </strong>
                <span class="text-caption text-muted tabular-nums">
                  {{ Number(account.savingsRatio).toFixed(1) }}%
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </BaseCard>

      <section class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-h2 text-ink">보유 예금·적금</h2>
          <span class="text-caption text-muted tabular-nums">{{ holdings.length }}개</span>
        </div>

        <div v-if="holdings.length" class="flex flex-col gap-4">
          <ProductHoldingCard
            v-for="holding in holdings"
            :key="holding.holdingProductId"
            :holding="holding"
            @select="handleSelectHolding"
          />
        </div>

        <BaseCard v-else color="yellow">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <h3 class="text-h2 text-ink">아직 가입한 예금·적금이 없어요</h3>
              <p class="text-caption text-muted">상품 탭에서 실제 상품 정보를 살펴보고 가입해 보세요.</p>
            </div>
            <BottomButton color="white" @click="handleBrowseProducts">
              상품 살펴보기
            </BottomButton>
          </div>
        </BaseCard>
      </section>
    </template>

    <BaseCard color="pink">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">실제 돈은 사용되지 않아요</h2>
        <p class="text-caption text-muted">
          가상의 자산과 실제 상품 정보로 투자 감각을 익히는 연습 서비스예요.
        </p>
      </div>
    </BaseCard>
  </div>
</template>
