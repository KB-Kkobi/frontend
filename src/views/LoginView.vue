<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "@/api/authApi";
import { ApiError } from "@/api/http";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";
import { useAuthStore } from "@/stores/auth";
import {
  hasAuthValidationErrors,
  validateLoginData,
} from "@/utils/authValidation";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const emailError = ref("");
const passwordError = ref("");
const isSubmitting = ref(false);

function clearErrors() {
  emailError.value = "";
  passwordError.value = "";
}

function getLoginErrorMessage(error) {
  if (!(error instanceof ApiError)) {
    return "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";
  }
  if (error.status === 0) return "서버에 연결할 수 없습니다.";
  if (error.status === 400) return "이메일과 비밀번호를 확인해주세요.";
  if (error.status === 401) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }

  return "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

async function redirectAfterLogin() {
  await router.replace({ name: "home" });
}

async function handleLogin() {
  if (isSubmitting.value) return;

  clearErrors();

  const loginData = {
    email: email.value.trim(),
    password: password.value,
  };

  const validationErrors = validateLoginData(loginData);
  if (hasAuthValidationErrors(validationErrors)) {
    emailError.value = validationErrors.email;
    passwordError.value = validationErrors.password;
    return;
  }

  isSubmitting.value = true;

  try {
    const tokenResponse = await loginUser(loginData);
    authStore.setSession(tokenResponse);
    await redirectAfterLogin();
  } catch (error) {
    const fieldErrors =
      error instanceof ApiError ? error.data?.fieldErrors : null;

    if (fieldErrors) {
      emailError.value = fieldErrors.email ?? "";
      passwordError.value = fieldErrors.password ?? "";
    } else {
      passwordError.value = getLoginErrorMessage(error);
    }
  } finally {
    isSubmitting.value = false;
  }
}

function handleSignup() {
  router.push({ name: "signup" });
}

function handleFindPassword() {
  router.push({ name: "password-reset" });
}
</script>

<template>
  <PageContainer>
    <div class="flex flex-1 flex-col gap-6 py-6">
      <div
        class="flex flex-1 items-center justify-center"
        aria-label="서비스 로고 영역"
      ></div>

      <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
        <BaseCard color="white">
          <div class="flex flex-col gap-4">
            <BaseTextField
              id="login-email"
              v-model="email"
              label="이메일"
              type="email"
              placeholder="이메일을 입력해주세요"
              autocomplete="email"
              inputmode="email"
              icon="email"
              :error-message="emailError"
              reserve-message-space
            />

            <BaseTextField
              id="login-password"
              v-model="password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력해주세요"
              autocomplete="current-password"
              icon="password"
              :error-message="passwordError"
              reserve-message-space
            />

            <div class="flex justify-end">
              <button
                type="button"
                class="text-caption text-muted"
                @click="handleFindPassword"
              >
                비밀번호 찾기 ›
              </button>
            </div>

            <BottomButton type="submit" color="yellow" :disabled="isSubmitting">
              {{ isSubmitting ? "로그인 중" : "로그인" }}
            </BottomButton>
          </div>
        </BaseCard>

        <BottomButton color="white" @click="handleSignup">
          회원가입 ›
        </BottomButton>
      </form>
    </div>
  </PageContainer>
</template>
