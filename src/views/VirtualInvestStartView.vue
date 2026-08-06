<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { AccountApiError, createAccount } from "@/api/accountApi";
import InvestmentAmountField from "@/components/account/InvestmentAmountField.vue";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import {
  ACCOUNT_AMOUNT_LIMITS,
  ACCOUNT_SETUP_DEFAULTS,
  INVESTMENT_PERIOD_MONTHS,
  MONTHLY_INVESTMENT_OPTIONS,
  SEED_MONEY_OPTIONS,
} from "@/constants/account";
import { formatCurrency } from "@/utils/format";

const router = useRouter();

const seedMoney = ref(ACCOUNT_SETUP_DEFAULTS.seedMoney);
const monthlyInvestAmount = ref(
  ACCOUNT_SETUP_DEFAULTS.monthlyInvestAmount,
);
const isSubmitting = ref(false);
const errorMessage = ref("");

const projectedInvestmentAmount = computed(
  () =>
    seedMoney.value +
    monthlyInvestAmount.value * INVESTMENT_PERIOD_MONTHS,
);

async function handleSubmit() {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    await createAccount({
      seedMoney: seedMoney.value,
      monthlyInvestAmount: monthlyInvestAmount.value,
    });
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
    <form
      class="flex flex-col gap-4 py-6"
      @submit.prevent="handleSubmit"
    >
      <header class="flex items-center gap-2">
        <BackButton />
        <h1 class="text-h2 text-ink">가상투자 시작하기</h1>
      </header>

      <div class="flex flex-col gap-2">
        <p class="text-h2 text-ink">투자를 시작하기 전,</p>
        <p class="text-h2 text-pink">나에게 맞는 조건을 설정해요</p>
        <p class="text-caption text-muted">
          설정한 금액은 언제든 마이페이지에서 바꿀 수 있어요.
        </p>
      </div>

      <InvestmentAmountField
        id="seed-money"
        v-model="seedMoney"
        title="초기 자산"
        description="가상투자를 시작할 시드머니예요"
        icon="wallet"
        :options="SEED_MONEY_OPTIONS"
        :maximum="ACCOUNT_AMOUNT_LIMITS.seedMoney"
      />

      <InvestmentAmountField
        id="monthly-investment-amount"
        v-model="monthlyInvestAmount"
        title="월 투자금"
        description="매월 자동으로 추가 투자될 금액이에요"
        icon="calendar"
        :options="MONTHLY_INVESTMENT_OPTIONS"
        :maximum="ACCOUNT_AMOUNT_LIMITS.monthlyInvestAmount"
      />

      <BaseCard color="blue">
        <div class="flex items-center gap-4">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue"
            aria-hidden="true"
          >
            <svg
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 3V6M17 3V6M4 9H20M5 5H19C19.6 5 20 5.4 20 6V19C20 19.6 19.6 20 19 20H5C4.4 20 4 19.6 4 19V6C4 5.4 4.4 5 5 5Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <path
                d="M8 14H16"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </span>

          <div class="flex min-w-0 flex-col gap-2">
            <p class="text-caption font-semibold text-blue">
              {{ INVESTMENT_PERIOD_MONTHS }}개월 후 총 투자 예정 금액
            </p>
            <strong class="text-h2 text-ink tabular-nums">
              {{ formatCurrency(projectedInvestmentAmount) }}
            </strong>
            <p class="text-caption text-muted">
              초기 자산 + 월 투자금 × {{ INVESTMENT_PERIOD_MONTHS }}개월
            </p>
          </div>
        </div>
      </BaseCard>

      <p v-if="errorMessage" class="text-caption text-error" role="alert">
        {{ errorMessage }}
      </p>

      <BottomButton type="submit" color="yellow" :disabled="isSubmitting">
        {{ isSubmitting ? "계좌를 만드는 중이에요" : "가상투자 시작하기" }}
      </BottomButton>
    </form>
  </PageContainer>
</template>
