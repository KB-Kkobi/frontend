import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { refreshAccessToken } from "@/api/http";
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  subscribeAuthSession,
} from "@/utils/authStorage";

export const useAuthStore = defineStore("auth", () => {
  const session = ref(readAuthSession());
  const isInitialized = ref(false);
  subscribeAuthSession((nextSession) => {
    session.value = nextSession;
  });

  const accessToken = computed(() => session.value?.accessToken ?? null);
  const isAuthenticated = computed(() => {
    if (!accessToken.value) return false;

    const expiresAt = session.value?.accessTokenExpiresAt;
    return !expiresAt || expiresAt > Date.now();
  });

  function setSession(tokenResponse) {
    if (!tokenResponse?.accessToken) {
      throw new Error("로그인 응답에 인증 토큰이 없습니다.");
    }

    session.value = {
      accessToken: tokenResponse.accessToken,
      tokenType: tokenResponse.tokenType || "Bearer",
      accessTokenExpiresAt: tokenResponse.accessTokenExpiresAt,
    };
    saveAuthSession(session.value);
  }

  function logout() {
    session.value = null;
    clearAuthSession();
  }

  async function initialize() {
    if (isInitialized.value) return;

    try {
      await refreshAccessToken();
    } catch {
      clearAuthSession();
    } finally {
      isInitialized.value = true;
    }
  }

  return {
    session,
    accessToken,
    isAuthenticated,
    isInitialized,
    setSession,
    logout,
    initialize,
  };
});
