<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "@/api/http";
import {
  deleteAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notificationApi";
import BaseModal from "@/components/common/BaseModal.vue";
import BaseToast from "@/components/common/BaseToast.vue";
import NotificationListItem from "@/components/notification/NotificationListItem.vue";
import { useNotificationStore } from "@/stores/notification";

const PANEL_GAP = 8;
const PANEL_EDGE_MARGIN = 16;

const router = useRouter();
const notificationStore = useNotificationStore();

const bellRef = ref(null);
const panelRef = ref(null);
const isOpen = ref(false);
const panelPosition = ref({ top: 0, right: 0 });

const notifications = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");
const isMarkingAllRead = ref(false);
const isDeleteAllModalOpen = ref(false);
const isDeletingAll = ref(false);

const toastMessage = ref("");
const isToastVisible = ref(false);

let isFetchingNotifications = false;

const displayCount = computed(() =>
  notificationStore.unreadCount > 99 ? "99+" : String(notificationStore.unreadCount),
);
const hasUnread = computed(() => notifications.value.some((item) => !item.read));

function showErrorToast(message) {
  toastMessage.value = message;
  isToastVisible.value = true;
}

function updatePanelPosition() {
  const rect = bellRef.value?.getBoundingClientRect();
  if (!rect) return;

  panelPosition.value = {
    top: rect.bottom + PANEL_GAP,
    right: Math.max(PANEL_EDGE_MARGIN, window.innerWidth - rect.right),
  };
}

async function loadNotifications() {
  if (isFetchingNotifications) return; // 이전 조회가 끝나기 전엔 새 요청을 겹치지 않는다.
  isFetchingNotifications = true;
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetchNotifications();
    notifications.value = Array.isArray(response) ? response : [];
  } catch (error) {
    notifications.value = [];
    errorMessage.value =
      error instanceof ApiError && error.status !== 0
        ? "알림을 불러오지 못했어요."
        : "알림을 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
  } finally {
    isLoading.value = false;
    isFetchingNotifications = false;
  }
}

function handleOutsideInteraction(event) {
  if (panelRef.value?.contains(event.target)) return;
  if (bellRef.value?.contains(event.target)) return;
  closePanel();
}

function handleKeydown(event) {
  if (event.key === "Escape") closePanel();
}

function addPanelListeners() {
  document.addEventListener("pointerdown", handleOutsideInteraction, true);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("scroll", closePanel, true);
  window.addEventListener("resize", closePanel);
}

function removePanelListeners() {
  document.removeEventListener("pointerdown", handleOutsideInteraction, true);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("scroll", closePanel, true);
  window.removeEventListener("resize", closePanel);
}

function openPanel() {
  updatePanelPosition();
  isOpen.value = true;
  addPanelListeners();
  // 폴링 주기가 아직 안 왔어도 직접 열었을 땐 항상 최신 상태를 보여준다.
  loadNotifications();
  notificationStore.refreshUnreadCount();
}

function closePanel() {
  if (!isOpen.value) return;
  isOpen.value = false;
  removePanelListeners();
}

function toggleForBell() {
  if (isOpen.value) {
    closePanel();
  } else {
    openPanel();
  }
}

// 알림 type별 이동 대상. 매칭되는 화면이 없으면 이동하지 않는다.
function resolveNotificationTarget(notification) {
  switch (notification.type) {
    case "FRIEND_REQUEST_RECEIVED":
      return { path: "/my/friends", query: { section: "received" } };
    case "FRIEND_REQUEST_ACCEPTED":
      return { path: "/my/friends", query: { section: "friends" } };
    case "TRADE_BUY_FILLED":
    case "TRADE_SELL_FILLED": {
      // referenceId는 securityOrderId — securityId로 착각하지 않도록 orderId로만 사용.
      const query = { segment: "history", type: "stock" };
      if (notification.referenceId) query.orderId = String(notification.referenceId);
      return { path: "/virtual/history", query };
    }
    default:
      return null;
  }
}

async function handleSelect(notification) {
  if (!notification.read) {
    try {
      await markNotificationRead(notification.notificationId);
      notification.read = true;
      notificationStore.decrementUnread();
      notificationStore.refreshUnreadCount(); // 즉시 감소 + 서버 값으로 재동기화
    } catch {
      showErrorToast("알림 상태를 변경하지 못했어요.");
    }
  }

  // "읽었는지"는 PATCH 호출 여부만 결정한다 — 이동 자체는 read 여부와 무관하게 항상 일어난다.
  closePanel();

  const target = resolveNotificationTarget(notification);
  if (target) router.push(target);
}

async function handleReadAll() {
  if (isMarkingAllRead.value) return;
  isMarkingAllRead.value = true;

  try {
    await markAllNotificationsRead();
    notifications.value.forEach((item) => {
      item.read = true;
    });
    notificationStore.resetUnread();
    notificationStore.refreshUnreadCount();
  } catch {
    showErrorToast("알림을 모두 읽음 처리하지 못했어요.");
  } finally {
    isMarkingAllRead.value = false;
  }
}

async function handleDeleteAll() {
  if (isDeletingAll.value) return;
  isDeletingAll.value = true;

  try {
    await deleteAllNotifications();
    notifications.value = [];
    notificationStore.resetUnread();
    notificationStore.refreshUnreadCount();
  } catch {
    showErrorToast("알림을 지우지 못했어요.");
  } finally {
    isDeletingAll.value = false;
  }
}

// 패널이 열려 있는 동안 폴링으로 unreadCount가 늘어나면(=새 알림 도착) 목록을 다시 불러온다.
watch(
  () => notificationStore.unreadCount,
  (next, prev) => {
    if (isOpen.value && next > prev) {
      loadNotifications();
    }
  },
);

// route 이동은 항상 dropdown을 닫은 뒤 일어나므로(closePanel → router.push),
// 뒤로가기로 돌아와도 panel이 열린 채로 나타나지 않는다.

onBeforeUnmount(removePanelListeners);
</script>

<template>
  <div class="relative">
    <button
      ref="bellRef"
      type="button"
      class="relative rounded-full p-2 text-ink transition-colors hover:bg-surface active:bg-surface"
      aria-label="알림"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="toggleForBell"
    >
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9C6 5.7 8.7 3 12 3C15.3 3 18 5.7 18 9V14L20 17H4L6 14V9Z"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linejoin="round"
        />
        <path d="M10 20H14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
      </svg>

      <Transition name="badge-pop">
        <span
          v-if="notificationStore.unreadCount > 0"
          class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink px-1 text-caption font-semibold leading-none text-white"
          aria-hidden="true"
        >
          {{ displayCount }}
        </span>
      </Transition>
    </button>

    <Transition name="panel-drop">
      <div
        v-if="isOpen"
        ref="panelRef"
        :style="{ top: `${panelPosition.top}px`, right: `${panelPosition.right}px` }"
        class="fixed z-50 flex w-notification-panel max-w-notification-panel flex-col overflow-hidden rounded-2xl bg-white shadow-popup"
        role="dialog"
        aria-label="알림"
      >
        <div class="flex items-center justify-between gap-2 px-4 py-3">
          <span class="text-body font-semibold text-ink">알림</span>
          <div class="flex shrink-0 items-center gap-3">
            <button
              type="button"
              class="rounded px-1 py-1 text-caption font-semibold text-pink transition-opacity disabled:cursor-not-allowed disabled:opacity-40 active:opacity-60"
              :disabled="!hasUnread || isMarkingAllRead"
              @click="handleReadAll"
            >
              전체 읽음
            </button>
            <button
              type="button"
              class="rounded px-1 py-1 text-caption font-semibold text-muted transition-opacity disabled:cursor-not-allowed disabled:opacity-40 active:opacity-60"
              :disabled="!notifications.length || isDeletingAll"
              @click="isDeleteAllModalOpen = true"
            >
              모두 지우기
            </button>
          </div>
        </div>

        <div class="border-t border-line-soft" />

        <div class="max-h-notification-panel overflow-y-auto">
          <p v-if="isLoading" class="px-4 py-6 text-center text-caption text-muted" role="status">
            불러오는 중이에요...
          </p>

          <p v-else-if="errorMessage" class="px-4 py-6 text-center text-caption text-muted" role="alert">
            {{ errorMessage }}
          </p>

          <div v-else-if="!notifications.length" class="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p class="text-body text-muted tracking-tight">알림이 없어요</p>
            <p class="text-caption text-muted tracking-tight">
              새로운 소식이 생기면 여기에서 알려드릴게요.
            </p>
          </div>

          <ul v-else class="flex flex-col divide-y divide-line-soft">
            <li v-for="notification in notifications" :key="notification.notificationId">
              <NotificationListItem :notification="notification" @select="handleSelect" />
            </li>
          </ul>
        </div>
      </div>
    </Transition>

    <BaseToast v-model="isToastVisible" :title="toastMessage" variant="error" />

    <BaseModal
      v-model="isDeleteAllModalOpen"
      message="알림을 모두 지울까요?"
      confirm-text="모두 지우기"
      cancel-text="취소"
      :cancel-disabled="isDeletingAll"
      @confirm="handleDeleteAll"
    >
      <template #content>
        <p class="text-center text-caption text-muted tracking-tight">
          삭제한 알림은 다시 확인할 수 없어요.
        </p>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.panel-drop-enter-active,
.panel-drop-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.panel-drop-enter-from,
.panel-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.badge-pop-enter-active,
.badge-pop-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.badge-pop-enter-from,
.badge-pop-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
</style>
