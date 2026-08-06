<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { signupUser } from "@/api/authApi";
import { ApiError } from "@/api/http";
import kkobiSignupImage from "@/assets/images/kkobiSignup.svg";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import {
  hasAuthValidationErrors,
  validateSignupData,
} from "@/utils/authValidation";

const router = useRouter();

const email = ref("");
const password = ref("");
const nickname = ref("");
const birthDate = ref("");

const emailError = ref("");
const passwordError = ref("");
const nicknameError = ref("");
const birthDateError = ref("");
const formError = ref("");
const isSubmitting = ref(false);

const formattedBirthDate = computed({
  get: () => birthDate.value,
  set: (value) => {
    birthDate.value = formatBirthDate(value);
  },
});

function formatBirthDate(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const dateParts = [
    digits.slice(0, 4),
    digits.slice(4, 6),
    digits.slice(6, 8),
  ];

  return dateParts.filter(Boolean).join(".");
}

function clearErrors() {
  emailError.value = "";
  passwordError.value = "";
  nicknameError.value = "";
  birthDateError.value = "";
  formError.value = "";
}

function applyFieldErrors(fieldErrors = {}) {
  emailError.value = fieldErrors.email ?? "";
  passwordError.value = fieldErrors.password ?? "";
  nicknameError.value = fieldErrors.nickname ?? "";
  birthDateError.value = fieldErrors.birthDate ?? "";
}

function applySignupApiError(error) {
  const fieldErrors =
    error instanceof ApiError ? error.data?.fieldErrors : null;
  if (fieldErrors) {
    applyFieldErrors(fieldErrors);
    return;
  }

  const message = error instanceof ApiError
    ? error.message
    : "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.";

  if (message.includes("이메일 또는 닉네임")) {
    formError.value = message;
  } else if (message.includes("비밀번호")) {
    passwordError.value = message;
  } else if (message.includes("이메일")) {
    emailError.value = message;
  } else if (message.includes("닉네임")) {
    nicknameError.value = message;
  } else if (message.includes("생년월일")) {
    birthDateError.value = message;
  } else {
    formError.value = message;
  }
}

async function handleSignup() {
  if (isSubmitting.value) return;

  clearErrors();

  const signupData = {
    email: email.value.trim(),
    password: password.value,
    nickname: nickname.value.trim(),
    birthDate: birthDate.value.replaceAll(".", "-"),
  };

  const validationErrors = validateSignupData(signupData);
  if (hasAuthValidationErrors(validationErrors)) {
    applyFieldErrors(validationErrors);
    return;
  }

  isSubmitting.value = true;

  try {
    await signupUser(signupData);
    await router.replace({ name: "login" });
  } catch (error) {
    applySignupApiError(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <PageContainer>
    <form class="flex flex-col gap-4 py-6" @submit.prevent="handleSignup">
      <header class="flex flex-col gap-4">
        <div>
          <BackButton />
        </div>

        <div class="relative">
          <img
            :src="kkobiSignupImage"
            alt="연필과 투자 기록판을 든 꼬비"
            class="absolute bottom-0 right-0 w-2/5 translate-y-4"
          />
          <div class="relative flex flex-col gap-2">
            <h1 class="text-amount text-ink">회원가입</h1>
            <p class="text-body text-ink">
              함께 <strong class="font-semibold text-pink">투자 여정</strong>을 시작해요!<br />
              나에게 맞는 투자를 찾아볼까요?
            </p>
          </div>
        </div>
      </header>

      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <BaseTextField
            id="signup-email"
            v-model="email"
            label="이메일"
            type="email"
            placeholder="이메일을 입력해주세요"
            autocomplete="email"
            inputmode="email"
            icon="email"
            :error-message="emailError"
          />

          <BaseTextField
            id="signup-password"
            v-model="password"
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            hint="영문, 숫자, 특수문자 포함 8자 이상 입력해주세요"
            autocomplete="new-password"
            icon="password"
            :error-message="passwordError"
          />

          <BaseTextField
            id="signup-nickname"
            v-model="nickname"
            label="닉네임"
            placeholder="닉네임을 입력해주세요"
            autocomplete="nickname"
            icon="user"
            :error-message="nicknameError"
          />

          <BaseTextField
            id="signup-birth-date"
            v-model="formattedBirthDate"
            label="생년월일"
            placeholder="2000.01.01"
            inputmode="numeric"
            :maxlength="10"
            autocomplete="bday"
            icon="calendar"
            :show-calendar-chevron="false"
            :error-message="birthDateError"
          />

          <p class="text-caption text-muted">
            회원가입 시 서비스 <span class="text-pink">이용약관</span> 및
            <span class="text-pink">개인정보 처리방침</span>에<br />
            동의한 것으로 간주됩니다.
          </p>

          <p v-if="formError" class="text-caption text-pink" role="alert">
            {{ formError }}
          </p>

          <BottomButton type="submit" color="yellow" :disabled="isSubmitting">
            {{ isSubmitting ? "회원가입 처리 중" : "회원가입" }}
          </BottomButton>
        </div>
      </BaseCard>
    </form>
  </PageContainer>
</template>
