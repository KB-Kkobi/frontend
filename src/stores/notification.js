import { ref } from "vue";
import { defineStore } from "pinia";
import { fetchUnreadCount as fetchUnreadCountApi } from "@/api/notificationApi";

// 새 알림이 생겨도 소켓 없이 어느 화면에 있든 뱃지가 갱신되도록 하는 주기.
// 10~15초 권장 범위 내에서 선택.
const POLL_INTERVAL_MS = 12000;

export const useNotificationStore = defineStore("notification", () => {
  const unreadCount = ref(0);

  let pollTimer = null;
  let isPolling = false;
  let inFlightRequest = null;

  // bell이 여러 화면에 동시에 존재해도 실제 GET 요청은 하나만 나가도록 공유한다.
  async function fetchUnreadCount() {
    if (inFlightRequest) return inFlightRequest;

    inFlightRequest = (async () => {
      try {
        const response = await fetchUnreadCountApi();
        unreadCount.value = response?.unreadCount ?? 0;
      } catch {
        // 조회 실패는 조용히 무시하고 다음 폴링 또는 다음 호출에서 재시도한다.
      } finally {
        inFlightRequest = null;
      }
    })();

    return inFlightRequest;
  }

  // bell open / focus / visibility 복귀처럼 "지금 당장 최신화"가 필요한 지점에서 호출.
  function refreshUnreadCount() {
    return fetchUnreadCount();
  }

  function decrementUnread(amount = 1) {
    unreadCount.value = Math.max(0, unreadCount.value - amount);
  }

  function resetUnread() {
    unreadCount.value = 0;
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") fetchUnreadCount();
  }

  function handleWindowFocus() {
    fetchUnreadCount();
  }

  function startPolling() {
    if (isPolling) return; // 이미 돌고 있으면 timer를 새로 만들지 않는다.
    isPolling = true;

    fetchUnreadCount();

    pollTimer = setInterval(() => {
      if (document.visibilityState === "hidden") return; // 탭이 보이지 않으면 조회를 건너뛴다.
      fetchUnreadCount();
    }, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
  }

  function stopPolling() {
    if (!isPolling) return;
    isPolling = false;

    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }

    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleWindowFocus);
  }

  return {
    unreadCount,
    fetchUnreadCount,
    refreshUnreadCount,
    decrementUnread,
    resetUnread,
    startPolling,
    stopPolling,
  };
});
