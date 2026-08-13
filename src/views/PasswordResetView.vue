<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import kkobiSignupImage from "@/assets/images/kkobiSignup.png";
import BackButton from "@/components/common/BackButton.vue";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";
import PageContainer from "@/components/common/PageContainer.vue";

const router = useRouter();

const email = ref("");
const verificationCode = ref("");
const newPassword = ref("");
const passwordConfirmation = ref("");

const emailError = ref("");
const verificationCodeError = ref("");
const newPasswordError = ref("");
const passwordConfirmationError = ref("");
const formError = ref("");
const isSendingCode = ref(false);
const isSubmitting = ref(false);
const verificationTime = ref("02:59");

function clearFormErrors() {
  verificationCodeError.value = "";
  newPasswordError.value = "";
  passwordConfirmationError.value = "";
  formError.value = "";
}

async function handleSendCode() {
  if (isSendingCode.value) return;

  emailError.value = "";
  isSendingCode.value = true;

  try {
    console.log("인증코드 전송 이메일:", email.value);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    verificationTime.value = "02:59";
  } catch (error) {
    emailError.value =
      error.response?.data?.fieldErrors?.email ??
      "인증코드를 보내지 못했습니다. 이메일을 확인해주세요.";
  } finally {
    isSendingCode.value = false;
  }
}

async function handleResetPassword() {
  if (isSubmitting.value) return;

  clearFormErrors();
  isSubmitting.value = true;

  const passwordResetData = {
    email: email.value,
    verificationCode: verificationCode.value,
    newPassword: newPassword.value,
    passwordConfirmation: passwordConfirmation.value,
  };

  try {
    console.log("비밀번호 변경 요청 데이터:", passwordResetData);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await router.replace({ name: "login" });
  } catch (error) {
    const fieldErrors = error.response?.data?.fieldErrors;

    if (error.response?.status === 400 && fieldErrors) {
      verificationCodeError.value = fieldErrors.verificationCode ?? "";
      newPasswordError.value = fieldErrors.newPassword ?? "";
      passwordConfirmationError.value =
        fieldErrors.passwordConfirmation ?? "";
    } else {
      formError.value =
        error.response?.data?.message ??
        "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.";
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <PageContainer>
    <form class="flex flex-col gap-4 py-6" @submit.prevent="handleResetPassword">
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
            <h1 class="text-amount text-ink">비밀번호 찾기</h1>
            <p class="text-body text-ink">
              가입하신 <strong class="font-semibold text-pink">이메일로 인증</strong> 후<br />
              새 비밀번호를 설정할 수 있어요
            </p>
          </div>
        </div>
      </header>

      <BaseCard color="white">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-4">
            <BaseTextField
              id="reset-email"
              v-model="email"
              label="이메일 입력"
              type="email"
              placeholder="가입하신 이메일을 입력해주세요"
              autocomplete="email"
              inputmode="email"
              icon="email"
              :error-message="emailError"
            />

            <BottomButton
              color="pink"
              :disabled="isSendingCode"
              @click="handleSendCode"
            >
              {{ isSendingCode ? "인증코드 전송 중" : "인증코드 보내기" }}
            </BottomButton>
          </div>

          <BaseTextField
            id="verification-code"
            v-model="verificationCode"
            label="인증코드 입력"
            placeholder="이메일로 받은 인증코드를 입력해주세요"
            inputmode="numeric"
            :maxlength="6"
            :trailing-text="verificationTime"
            hint="인증코드는 3분 동안 유효합니다"
            icon="email"
            :error-message="verificationCodeError"
          />

          <div class="flex flex-col gap-4">
            <BaseTextField
              id="new-password"
              v-model="newPassword"
              label="새 비밀번호 설정"
              type="password"
              placeholder="새 비밀번호를 입력해주세요"
              autocomplete="new-password"
              icon="password"
              :error-message="newPasswordError"
            />

            <BaseTextField
              id="password-confirmation"
              v-model="passwordConfirmation"
              label="새 비밀번호 확인"
              type="password"
              placeholder="새 비밀번호를 다시 입력해주세요"
              autocomplete="new-password"
              hint="영문, 숫자, 특수문자 조합 8~20자"
              icon="password"
              :error-message="passwordConfirmationError"
            />
          </div>

          <p v-if="formError" class="text-caption text-error" role="alert">
            {{ formError }}
          </p>

          <BottomButton type="submit" color="pink" :disabled="isSubmitting">
            {{ isSubmitting ? "비밀번호 변경 중" : "비밀번호 변경하기" }}
          </BottomButton>
        </div>
      </BaseCard>
    </form>
  </PageContainer>
</template>
