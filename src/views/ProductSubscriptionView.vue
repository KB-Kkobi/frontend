<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/api/http";
import {
  PRODUCT_API_ERROR_CODES,
  ProductApiError,
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
  PRODUCT_PAYMENT_DAYS,
  PRODUCT_TYPES,
  getProductTypeLabel,
  normalizeProductType,
} from "@/constants/product";
import { calculateMaturityDate, formatLocalDate } from "@/utils/date";
import {
  formatCurrency,
  formatCurrencyInput,
  formatInterestRate,
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
const loadErrorMessage = ref("");
const amountErrorMessage = ref("");
const paymentDayErrorMessage = ref("");
const formErrorMessage = ref("");
const isConfirmationOpen = ref(false);

const productType = computed(() =>
  normalizeProductType(product.value?.productType ?? route.params.productType),
);

const isSaving = computed(() => productType.value === PRODUCT_TYPES.SAVING);
const productTypeLabel = computed(() => getProductTypeLabel(productType.value));
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
    ? `최고 가입 한도 ${formatCurrency(product.value.maxLimit)}`
    : "원 단위로 입력해 주세요.",
);

const hasPreferentialRate = computed(
  () => selectedOption.value?.maximumInterestRate !== null &&
    selectedOption.value?.maximumInterestRate !== undefined,
);

const appliedRate = computed(() => {
  if (!selectedOption.value) return null;
  return preferentialRateApplied.value
    ? selectedOption.value.maximumInterestRate
    : selectedOption.value.interestRate;
});

const expectedMaturityDate = computed(() =>
  calculateMaturityDate(selectedOption.value?.savingTerm),
);

const confirmationMessage = computed(() => {
  if (!product.value || !selectedOption.value || !joinAmount.value) return "";
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
  formErrorMessage.value = "";
}

function handleAmountInput(value) {
  joinAmountInput.value = formatCurrencyInput(value);
  amountErrorMessage.value = "";
  formErrorMessage.value = "";
}

function handlePreferentialRate(value) {
  if (value && !hasPreferentialRate.value) return;
  preferentialRateApplied.value = value;
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

function handleOpenConfirmation() {
  if (validateForm()) isConfirmationOpen.value = true;
}

async function handleSubscribe() {
  if (!validateForm() || isSubmitting.value) return;

  isSubmitting.value = true;
  formErrorMessage.value = "";

  const request = {
    productOptionId: selectedOption.value.productOptionId,
    joinAmount: joinAmount.value,
    preferentialRateApplied: preferentialRateApplied.value,
  };

  if (isSaving.value) request.paymentDay = Number(paymentDay.value);

  try {
    await subscribeProduct(request);
    await router.push({
      name: "product-holdings",
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

  try {
    product.value = await fetchProductDetail(
      route.params.productType,
      route.params.productId,
    );
  } catch (error) {
    loadErrorMessage.value = getLoadErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [route.params.productType, route.params.productId],
  loadProduct,
  { immediate: true },
);
</script>

<template>
  <PageContainer>
    <div class="flex flex-col gap-6 py-6">
      <header class="flex items-center gap-2">
        <BackButton />
        <h1 class="text-h1 text-ink">예적금 가입</h1>
      </header>

      <BaseCard v-if="isLoading" color="blue">
        <div class="flex flex-col gap-2" role="status">
          <h2 class="text-h2 text-ink">가입 정보를 준비하고 있어요</h2>
          <p class="text-caption text-muted">잠시만 기다려 주세요.</p>
        </div>
      </BaseCard>

      <BaseCard v-else-if="loadErrorMessage" color="pink">
        <div class="flex flex-col gap-4" role="alert">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">상품 정보를 불러오지 못했어요</h2>
            <p class="text-caption text-muted">{{ loadErrorMessage }}</p>
          </div>
          <BottomButton color="white" @click="loadProduct">
            다시 시도하기
          </BottomButton>
        </div>
      </BaseCard>

      <template v-else-if="product">
        <BaseCard color="yellow">
          <div class="flex flex-col gap-2">
            <p class="text-caption font-semibold text-pink">
              {{ productTypeLabel }}
            </p>
            <p class="text-caption text-muted">
              {{ product.financialCompanyName }}
            </p>
            <h2 class="text-h1 text-ink">{{ product.productName }}</h2>
          </div>
        </BaseCard>

        <section class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="text-h2 text-ink">금리 옵션 선택</h2>
            <p class="text-caption text-muted">
              가입 기간과 금리를 확인한 뒤 하나를 선택해 주세요.
            </p>
          </div>

          <div
            v-if="productOptions.length"
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

          <BaseCard v-else color="blue">
            <p class="text-body text-ink">가입할 수 있는 금리 옵션이 없어요.</p>
          </BaseCard>
        </section>

        <BaseCard color="white">
          <div class="flex flex-col gap-6">
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

            <div v-if="isSaving" class="flex flex-col gap-2">
              <label for="payment-day" class="text-body font-semibold text-ink">
                월 납입일
              </label>
              <div class="rounded-2xl border border-line bg-white px-4">
                <select
                  id="payment-day"
                  v-model="paymentDay"
                  class="w-full bg-white py-3 text-body text-ink outline-none"
                  :aria-invalid="Boolean(paymentDayErrorMessage)"
                  @change="paymentDayErrorMessage = ''"
                >
                  <option value="">납입일을 선택해 주세요</option>
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

            <div class="flex flex-col gap-2">
              <p class="text-body font-semibold text-ink">우대 금리 적용 여부</p>
              <div class="flex gap-2">
                <BasePill
                  as="button"
                  type="button"
                  label="기본 금리 적용"
                  color="pink"
                  :variant="preferentialRateApplied ? 'ghost' : 'filled'"
                  @click="handlePreferentialRate(false)"
                />
                <BasePill
                  as="button"
                  type="button"
                  label="우대 금리 적용"
                  color="pink"
                  :variant="preferentialRateApplied ? 'filled' : 'ghost'"
                  :disabled="!hasPreferentialRate"
                  @click="handlePreferentialRate(true)"
                />
              </div>
              <p class="text-caption text-muted">
                실제 우대 조건 충족 여부는 상품 안내를 확인해 주세요.
              </p>
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="selectedOption" color="blue">
          <div class="flex flex-col gap-4">
            <h2 class="text-h2 text-ink">가입 조건 확인</h2>
            <dl class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">적용 금리</dt>
                <dd class="text-h2 text-profit tabular-nums">
                  {{ formatInterestRate(appliedRate) }}
                </dd>
              </div>
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">가입 기간</dt>
                <dd class="text-h2 text-ink tabular-nums">
                  {{ selectedOption.savingTerm }}개월
                </dd>
              </div>
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">예상 만기일</dt>
                <dd class="text-body text-ink tabular-nums">
                  {{ formatLocalDate(expectedMaturityDate) }}
                </dd>
              </div>
              <div class="flex flex-col gap-2">
                <dt class="text-caption text-muted">{{ amountLabel }}</dt>
                <dd class="text-body text-ink tabular-nums">
                  {{ formatCurrency(joinAmount) }}
                </dd>
              </div>
            </dl>
          </div>
        </BaseCard>

        <p v-if="formErrorMessage" class="text-body text-error" role="alert">
          {{ formErrorMessage }}
        </p>

        <BottomButton
          :disabled="isSubmitting || !productOptions.length"
          @click="handleOpenConfirmation"
        >
          {{ isSubmitting ? "가입 처리 중" : "입력 정보 확인하고 가입하기" }}
        </BottomButton>
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
