import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
} from "@/utils/authStorage";

export const useAuthStore = defineStore("auth", () => {
  const session = ref(readAuthSession());

  const accessToken = computed(() => session.value?.accessToken ?? null);
  const isAuthenticated = computed(() => {
    if (!accessToken.value) return false;

    const expiresAt = session.value?.accessTokenExpiresAt;
    return !expiresAt || expiresAt > Date.now();
  });

  function setSession(tokenResponse) {
    if (!tokenResponse?.accessToken || !tokenResponse?.refreshToken) {
      throw new Error("로그인 응답에 인증 토큰이 없습니다.");
    }

    session.value = {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      tokenType: tokenResponse.tokenType || "Bearer",
      accessTokenExpiresAt: tokenResponse.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokenResponse.refreshTokenExpiresAt,
    };
    saveAuthSession(session.value);
  }

  function logout() {
    session.value = null;
    clearAuthSession();
  }

  return {
    session,
    accessToken,
    isAuthenticated,
    setSession,
    logout,
  };
});
