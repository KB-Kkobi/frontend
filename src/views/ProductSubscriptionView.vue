<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/api/http";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
  estimateProductSubscription,
  fetchProductDetail,
  subscribeProduct,
} from "@/api/productApi";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BasePill from "@/components/common/BasePill.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import ProductSubscriptionOptionCard from "@/components/product/ProductSubscriptionOptionCard.vue";
import {
  PRODUCT_AMOUNT_OPTIONS,
  PRODUCT_PAYMENT_DAYS,
  PRODUCT_TYPES,
  getProductTypeLabel,
  normalizeProductType,
} from "@/constants/product";
import { formatLocalDate } from "@/utils/date";
import {
  formatCurrency,
  formatCurrencyInput,
  formatInterestRate,
  formatKoreanShortAmount,
  formatNullableText,
  parseCurrencyInput,
} from "@/utils/format";

const route = useRoute();
const router = useRouter();

const product = ref(null);
const selectedOptionId = ref(null);
const joinAmountInput = ref("");
const paymentDay = ref("");
const preferentialRateApplied = ref(false);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isEstimating = ref(false);
const loadErrorMessage = ref("");
const amountErrorMessage = ref("");
const paymentDayErrorMessage = ref("");
const formErrorMessage = ref("");
const isConfirmationOpen = ref(false);
const subscriptionEstimate = ref(null);

const productType = computed(() =>
  normalizeProductType(product.value?.productType ?? route.params.productType),
);
const isSaving = computed(() => productType.value === PRODUCT_TYPES.SAVING);
const productTypeLabel = computed(() => getProductTypeLabel(productType.value));
const pageTitle = computed(() => `${productTypeLabel.value} 가입`);
const productOptions = computed(() =>
  Array.isArray(product.value?.options) ? product.value.options : [],
);
const selectedOption = computed(() =>
  productOptions.value.find(
    (option) => option.productOptionId === selectedOptionId.value,
  ),
);
const joinAmount = computed(() => parseCurrencyInput(joinAmountInput.value));
const amountLabel = computed(() =>
  isSaving.value ? "월 납입 금액" : "가입 금액",
);
const amountHint = computed(() =>
  product.value?.maxLimit
    ? `가입 가능 금액은 최대 ${formatCurrency(product.value.maxLimit)}이에요.`
    : "원 단위로 입력해 주세요.",
);

const minimumInterestRate = computed(() => {
  const rates = productOptions.value
    .map((option) => Number(option.interestRate))
    .filter(Number.isFinite);
  return rates.length ? Math.min(...rates) : null;
});

const maximumInterestRate = computed(() => {
  const rates = productOptions.value
    .map((option) => Number(option.maximumInterestRate))
    .filter(Number.isFinite);
  return rates.length ? Math.max(...rates) : null;
});

const hasPreferentialRate = computed(
  () =>
    selectedOption.value?.maximumInterestRate !== null &&
    selectedOption.value?.maximumInterestRate !== undefined,
);

const preferentialRateDifference = computed(() => {
  if (!selectedOption.value) return null;
  const difference =
    Number(selectedOption.value.maximumInterestRate) -
    Number(selectedOption.value.interestRate);
  return Number.isFinite(difference) && difference > 0 ? difference : 0;
});

const appliedRate = computed(() => subscriptionEstimate.value?.appliedRate ?? null);
const expectedMaturityDate = computed(
  () => subscriptionEstimate.value?.maturityDate ?? null,
);
const expectedAmounts = computed(() => ({
  expectedPrincipal: subscriptionEstimate.value?.expectedPrincipal ?? null,
  expectedInterest: subscriptionEstimate.value?.expectedAfterTaxInterest ?? null,
  expectedAmount: subscriptionEstimate.value?.expectedMaturityAmount ?? null,
}));

const amountOptions = computed(() => {
  const options = PRODUCT_AMOUNT_OPTIONS[productType.value] ?? [];
  const maximumLimitValue = product.value?.maxLimit;
  if (maximumLimitValue === null || maximumLimitValue === undefined) return options;

  const maximumLimit = Number(maximumLimitValue);
  if (!Number.isFinite(maximumLimit)) return options;
  return options.filter((amount) => amount <= maximumLimit);
});

const confirmationMessage = computed(() => {
  if (!product.value || !subscriptionEstimate.value) return "";
  return `${product.value.productName}에 ${formatCurrency(joinAmount.value)}으로 가입할까요? 적용 금리는 ${formatInterestRate(appliedRate.value)}, 예상 만기일은 ${formatLocalDate(expectedMaturityDate.value)}입니다.`;
});

function getRequestErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "상품 가입 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function getLoadErrorMessage(error) {
  if (error instanceof ProductApiError) {
    if (error.code === PRODUCT_API_ERROR_CODES.UNAUTHORIZED) {
      return "로그인 정보가 만료되었습니다. 다시 로그인해 주세요.";
    }
    return error.message;
  }
  return "상품 정보를 불러오지 못했습니다.";
}

function handleSelectOption(option) {
  selectedOptionId.value = option.productOptionId;
  preferentialRateApplied.value = false;
  subscriptionEstimate.value = null;
  formErrorMessage.value = "";
}

function handleAmountInput(value) {
  joinAmountInput.value = formatCurrencyInput(value);
  subscriptionEstimate.value = null;
  amountErrorMessage.value = "";
  formErrorMessage.value = "";
}

function handleSelectAmount(amount) {
  handleAmountInput(String(amount));
}

function handlePreferentialRate(value) {
  if (value && !hasPreferentialRate.value) return;
  preferentialRateApplied.value = value;
  subscriptionEstimate.value = null;
}

function validateForm() {
  amountErrorMessage.value = "";
  paymentDayErrorMessage.value = "";
  formErrorMessage.value = "";

  if (!selectedOption.value) {
    formErrorMessage.value = "가입할 금리 옵션을 선택해 주세요.";
    return false;
  }

  if (!joinAmount.value || joinAmount.value <= 0) {
    amountErrorMessage.value = `${amountLabel.value}을 입력해 주세요.`;
    return false;
  }

  const maximumLimitValue = product.value?.maxLimit;
  if (maximumLimitValue !== null && maximumLimitValue !== undefined) {
    const maximumLimit = Number(maximumLimitValue);
    if (Number.isFinite(maximumLimit) && joinAmount.value > maximumLimit) {
      amountErrorMessage.value = "상품의 최고 가입 한도를 초과했습니다.";
      return false;
    }
  }

  if (isSaving.value && !paymentDay.value) {
    paymentDayErrorMessage.value = "월 납입일을 선택해 주세요.";
    return false;
  }

  return true;
}

function createSubscriptionRequest() {
  const request = {
    productOptionId: selectedOption.value.productOptionId,
    joinAmount: joinAmount.value,
    preferentialRateApplied: preferentialRateApplied.value,
  };
  if (isSaving.value) request.paymentDay = Number(paymentDay.value);
  return request;
}

async function handleOpenConfirmation() {
  if (!validateForm() || isEstimating.value) return;

  isEstimating.value = true;
  formErrorMessage.value = "";

  try {
    subscriptionEstimate.value = await estimateProductSubscription(
      createSubscriptionRequest(),
    );
    isConfirmationOpen.value = true;
  } catch (error) {
    formErrorMessage.value = getRequestErrorMessage(error);
  } finally {
    isEstimating.value = false;
  }
}

async function handleSubscribe() {
  if (!validateForm() || isSubmitting.value) return;

  isSubmitting.value = true;
  formErrorMessage.value = "";

  try {
    await subscribeProduct(createSubscriptionRequest());
    await router.push({
      name: "virtual-assets",
      query: { subscribed: "true" },
    });
  } catch (error) {
    formErrorMessage.value = getRequestErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}

async function loadProduct() {
  isLoading.value = true;
  loadErrorMessage.value = "";
  product.value = null;
  selectedOptionId.value = null;
  subscriptionEstimate.value = null;

  try {
    product.value = await fetchProductDetail(
      route.params.productType,
      route.params.productId,
    );
    const defaultOption =
      product.value?.options?.find((option) => option.savingTerm === 12) ??
      product.value?.options?.[0];
    selectedOptionId.value = defaultOption?.productOptionId ?? null;
  } catch (error) {
    loadErrorMessage.value = getLoadErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

watch(paymentDay, () => {
  subscriptionEstimate.value = null;
  paymentDayErrorMessage.value = "";
});

watch(
  () => [route.params.productType, route.params.productId],
  loadProduct,
  { immediate: true },
);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-4 py-6">
      <header class="flex items-center gap-2">
        <BackButton />
        <h1 class="text-h1 text-ink">{{ pageTitle }}</h1>
      </header>

      <BaseCard v-if="isLoading" color="blue">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">가입 정보를 준비하고 있어요</h2>
          <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
        </div>
      </BaseCard>

      <BaseCard v-else-if="loadErrorMessage" color="white" elevation="flat">
        <div class="flex flex-col gap-4" role="alert">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">상품 정보를 불러오지 못했어요</h2>
            <p class="text-caption text-muted">{{ loadErrorMessage }}</p>
          </div>
          <BottomButton color="white" @click="loadProduct">다시 시도하기</BottomButton>
        </div>
      </BaseCard>

      <template v-else-if="product">
        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-soft text-h2 text-pink"
              >
                {{ product.financialCompanyName?.charAt(0) || "금" }}
              </span>
              <div class="flex flex-col gap-2">
                <h2 class="text-h2 text-ink">{{ product.productName }}</h2>
                <p class="text-caption text-muted">
                  {{ formatNullableText(product.financialCompanyName) }}
                </p>
              </div>
            </div>

            <dl class="grid grid-cols-2 gap-4 border-t border-line pt-4">
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">기본 금리</dt>
                <dd class="text-h1 text-ink tabular-nums">
                  {{ formatInterestRate(minimumInterestRate) }}
                </dd>
              </div>
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">최고 금리</dt>
                <dd class="text-h1 text-profit tabular-nums">
                  {{ formatInterestRate(maximumInterestRate) }}
                </dd>
              </div>
            </dl>

            <div class="flex flex-wrap gap-2">
              <BasePill
                :label="formatNullableText(selectedOption?.interestRateTypeName)"
                color="blue"
              />
              <BasePill
                v-if="isSaving && selectedOption?.reserveTypeName"
                :label="selectedOption.reserveTypeName"
                color="green"
              />
            </div>
          </div>
        </BaseCard>

        <section class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">가입 기간 고르기</h2>
            <p class="text-caption text-muted">기간에 따라 금리가 달라져요.</p>
          </div>

          <div
            v-if="isSaving"
            class="flex flex-col gap-4"
            role="radiogroup"
            aria-label="가입 금리 옵션"
          >
            <ProductSubscriptionOptionCard
              v-for="option in productOptions"
              :key="option.productOptionId"
              :option="option"
              :is-selected="selectedOptionId === option.productOptionId"
              @select="handleSelectOption"
            />
          </div>

          <BaseCard v-else color="white">
            <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="가입 기간">
              <BasePill
                v-for="option in productOptions"
                :key="option.productOptionId"
                as="button"
                type="button"
                :label="`${option.savingTerm}개월`"
                color="yellow"
                :variant="selectedOptionId === option.productOptionId ? 'filled' : 'ghost'"
                :aria-pressed="selectedOptionId === option.productOptionId"
                @click="handleSelectOption(option)"
              />
            </div>
          </BaseCard>
        </section>

        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <BaseTextField
              id="join-amount"
              :model-value="joinAmountInput"
              :label="amountLabel"
              inputmode="numeric"
              placeholder="금액을 입력해 주세요"
              trailing-text="원"
              :hint="amountHint"
              :error-message="amountErrorMessage"
              @update:model-value="handleAmountInput"
            />

            <div class="flex flex-wrap gap-2" aria-label="추천 가입 금액">
              <BasePill
                v-for="amount in amountOptions"
                :key="amount"
                as="button"
                type="button"
                :label="formatKoreanShortAmount(amount)"
                color="yellow"
                :variant="joinAmount === amount ? 'filled' : 'ghost'"
                @click="handleSelectAmount(amount)"
              />
            </div>

            <div v-if="isSaving" class="flex flex-col gap-2">
              <label for="payment-day" class="text-body font-semibold text-ink">
                납입일
              </label>
              <div class="rounded-2xl border border-line bg-white px-4">
                <select
                  id="payment-day"
                  v-model="paymentDay"
                  class="w-full bg-white py-3 text-body text-ink outline-none"
                  :aria-invalid="Boolean(paymentDayErrorMessage)"
                  @change="paymentDayErrorMessage = ''"
                >
                  <option value="">월 납입일을 선택해 주세요</option>
                  <option v-for="day in PRODUCT_PAYMENT_DAYS" :key="day" :value="day">
                    매월 {{ day }}일
                  </option>
                </select>
              </div>
              <p
                v-if="paymentDayErrorMessage"
                class="text-caption text-error"
                role="alert"
              >
                {{ paymentDayErrorMessage }}
              </p>
            </div>
          </div>
        </BaseCard>

        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <h2 class="text-h2 text-ink">받을 수 있는 우대조건</h2>
              <p class="whitespace-pre-line text-caption text-muted">
                {{ formatNullableText(product.preferentialConditions) }}
              </p>
            </div>

            <div class="flex items-center justify-between gap-4 border-t border-line pt-4">
              <div class="flex flex-col gap-2">
                <p class="text-body font-semibold text-ink">우대 조건 충족</p>
                <p class="text-caption text-muted">충족 여부에 따라 적용 금리가 달라져요.</p>
              </div>
              <BasePill
                as="button"
                type="button"
                :label="preferentialRateApplied ? '적용 중' : '적용 안 함'"
                color="pink"
                :variant="preferentialRateApplied ? 'filled' : 'ghost'"
                :disabled="!hasPreferentialRate"
                :aria-pressed="preferentialRateApplied"
                @click="handlePreferentialRate(!preferentialRateApplied)"
              />
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="subscriptionEstimate" color="blue">
          <div class="flex flex-col gap-4">
            <h2 class="text-h2 text-ink">내 예상 수령액</h2>
            <dl class="flex flex-col gap-2">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-caption text-muted">기본 금리</dt>
                <dd class="text-body text-ink tabular-nums">
                  {{ formatInterestRate(selectedOption.interestRate) }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-caption text-muted">우대 금리</dt>
                <dd class="text-body text-profit tabular-nums">
                  +{{ formatInterestRate(preferentialRateDifference) }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-caption text-muted">적용 금리</dt>
                <dd class="text-h2 text-profit tabular-nums">
                  {{ formatInterestRate(appliedRate) }}
                </dd>
              </div>
            </dl>

            <dl class="flex flex-col gap-2 border-t border-line pt-4">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-caption text-muted">예상 원금</dt>
                <dd class="text-body text-ink tabular-nums">
                  {{ formatCurrency(expectedAmounts.expectedPrincipal) }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-caption text-muted">세후 예상 이자</dt>
                <dd class="text-body text-ink tabular-nums">
                  {{ formatCurrency(expectedAmounts.expectedInterest) }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-body font-semibold text-ink">만기 수령액</dt>
                <dd class="text-amount text-profit tabular-nums">
                  {{ formatCurrency(expectedAmounts.expectedAmount) }}
                </dd>
              </div>
            </dl>

            <BaseCard color="green">
              <p class="text-caption text-muted">
                만기일은 {{ formatLocalDate(expectedMaturityDate) }}이며, 실제 이자는 납입일과
                상품 조건에 따라 달라질 수 있어요.
              </p>
            </BaseCard>
          </div>
        </BaseCard>

        <p v-if="formErrorMessage" class="text-body text-error" role="alert">
          {{ formErrorMessage }}
        </p>

        <BottomButton
          color="pink"
          :disabled="isSubmitting || isEstimating || !productOptions.length"
          @click="handleOpenConfirmation"
        >
          {{
            isSubmitting
              ? "가입 처리 중"
              : isEstimating
                ? "예상 금액 확인 중"
                : "가입하기"
          }}
        </BottomButton>
        <p class="text-caption text-muted text-center">
          가입 자산은 가상투자 계좌에 반영됩니다.
        </p>
      </template>
    </div>
  </PageContainer>

  <BaseModal
    v-model="isConfirmationOpen"
    :message="confirmationMessage"
    confirm-text="가입하기"
    cancel-text="다시 확인"
    @confirm="handleSubscribe"
  />
</template>
