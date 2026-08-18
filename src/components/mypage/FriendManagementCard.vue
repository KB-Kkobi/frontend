<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import {
  acceptFriendRequest,
  cancelSentFriendRequest,
  deleteFriend,
  fetchFriends,
  fetchReceivedFriendRequests,
  fetchSentFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
} from "@/api/friendApi";
import { ApiError } from "@/api/http";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BasePill from "@/components/common/BasePill.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BaseToast from "@/components/common/BaseToast.vue";
import BottomButton from "@/components/common/BottomButton.vue";

const route = useRoute();

// 알림(친구 신청/수락)에서 들어왔을 때 해당 영역으로 스크롤 + 잠깐 하이라이트하기 위한 상태.
const receivedSectionRef = ref(null);
const friendsSectionRef = ref(null);
const highlightedSection = ref(null);
let highlightTimer = null;

// 받은 요청은 즉시 처리할 액션이 있어 요청이 있으면 자동으로 펼치고, 사용자가 접어도
// 새 요청이 추가되면 다시 펼친다. 보낸 요청은 확인용 정보라 항상 사용자의 선택을 따른다.
const isReceivedOpen = ref(false);
const isSentOpen = ref(false);

async function focusDeepLinkedSection() {
  const section = route.query.section;
  if (section === "received") isReceivedOpen.value = true;

  const targetEl =
    section === "received"
      ? receivedSectionRef.value
      : section === "friends"
        ? friendsSectionRef.value
        : null;

  if (!targetEl) return;

  await nextTick();
  targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
  highlightedSection.value = section;

  if (highlightTimer !== null) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    highlightedSection.value = null;
    highlightTimer = null;
  }, 1200);
}

const nicknameInput = ref("");
const receivedRequests = ref([]);
const friends = ref([]);
const receivedRequestErrorMessage = ref("");
const friendListErrorMessage = ref("");
const isToastVisible = ref(false);
const toastVariant = ref("success");
const toastTitle = ref("");
const isReceivedRequestsLoading = ref(true);
const isFriendsLoading = ref(true);
const isSendingRequest = ref(false);
const processingRequestId = ref(null);
const processingRequestAction = ref("");
const deletingFriendId = ref(null);
const selectedFriend = ref(null);
const isDeleteModalOpen = ref(false);
const cancellingFriendshipId = ref(null);
const selectedSentRequest = ref(null);
const isCancelRequestModalOpen = ref(false);
const sentRequests = ref([]);
const sentRequestErrorMessage = ref("");
const isSentRequestsLoading = ref(true);

// 받은 요청이 새로 늘어나면(0→1, 1→2 등) 사용자가 접어놨어도 다시 펼친다.
// 줄어드는 경우엔(수락/거절/폴링) 사용자가 보고 있는 상태를 강제로 접지 않는다.
watch(
  () => receivedRequests.value.length,
  (next, prev) => {
    if (next > prev) isReceivedOpen.value = true;
  },
);

const deleteConfirmationMessage = computed(() =>
  selectedFriend.value
    ? `${selectedFriend.value.nickname}님을 친구 목록에서 삭제하시겠습니까?`
    : "친구를 삭제하시겠습니까?",
);

function getErrorMessage(error, fallbackMessage) {
  return error instanceof ApiError && error.message
    ? error.message
    : fallbackMessage;
}

function getResponseMessage(response, fallbackMessage) {
  return response?.message || fallbackMessage;
}

function showToast(variant, title) {
  toastVariant.value = variant;
  toastTitle.value = title;
  isToastVisible.value = true;
}

async function loadReceivedRequests({ silent = false } = {}) {
  if (!silent) {
    isReceivedRequestsLoading.value = true;
    receivedRequestErrorMessage.value = "";
  }

  try {
    const response = await fetchReceivedFriendRequests();
    receivedRequests.value = Array.isArray(response) ? response : [];
  } catch (error) {
    if (!silent) {
      receivedRequestErrorMessage.value = getErrorMessage(
        error,
        "받은 친구 요청을 불러오지 못했습니다.",
      );
    }
  } finally {
    if (!silent) isReceivedRequestsLoading.value = false;
  }
}

async function loadFriends({ silent = false } = {}) {
  if (!silent) {
    isFriendsLoading.value = true;
    friendListErrorMessage.value = "";
  }

  try {
    const response = await fetchFriends();
    friends.value = Array.isArray(response) ? response : [];
  } catch (error) {
    if (!silent) {
      friendListErrorMessage.value = getErrorMessage(
        error,
        "친구 목록을 불러오지 못했습니다.",
      );
    }
  } finally {
    if (!silent) isFriendsLoading.value = false;
  }
}

async function loadFriendData(options) {
  await Promise.all([loadReceivedRequests(options), loadFriends(options)]);
}

// 상대방의 수락/거절/신청이 새로고침 없이 반영되도록 화면이 떠 있는 동안 주기적으로 조용히 재조회한다.
// 실시간 push(WebSocket)가 아니라 폴링이라 이 간격만큼의 지연은 있다.
// 보낸 친구 요청은 이 폴링에 포함하지 않는다 — 화면에 상시 노출된다고 해서 API 호출 빈도까지
// 늘리지 않기 위해, 최초 진입 시 + 직접 요청을 보낸 직후에만 새로 불러온다.
const FRIEND_POLL_INTERVAL_MS = 4000;
let friendDataPollTimer = null;
let isFriendPollInFlight = false;

function pollFriendData() {
  // 수락/거절/삭제가 진행 중일 때 재조회하면 로컬로 지운 항목이 되살아나 보일 수 있어 건너뛴다.
  if (processingRequestId.value !== null || deletingFriendId.value !== null) return;
  // 이전 폴링 요청이 아직 끝나지 않았으면 건너뛴다 — 간격이 왕복시간보다 짧을 때 요청이 쌓이는 것을 방지.
  if (isFriendPollInFlight) return;

  isFriendPollInFlight = true;
  loadFriendData({ silent: true }).finally(() => {
    isFriendPollInFlight = false;
  });
}

async function loadSentRequests({ silent = false } = {}) {
  if (!silent) {
    isSentRequestsLoading.value = true;
    sentRequestErrorMessage.value = "";
  }

  try {
    const response = await fetchSentFriendRequests();
    sentRequests.value = Array.isArray(response) ? response : [];
  } catch (error) {
    if (!silent) {
      sentRequestErrorMessage.value = getErrorMessage(
        error,
        "보낸 친구 신청을 불러오지 못했습니다.",
      );
    }
  } finally {
    if (!silent) isSentRequestsLoading.value = false;
  }
}

async function handleSendRequest() {
  const nickname = nicknameInput.value.trim();

  if (!nickname) {
    showToast("error", "친구 닉네임을 입력해 주세요.");
    return;
  }

  if (isSendingRequest.value) return;
  isSendingRequest.value = true;

  try {
    const response = await sendFriendRequest(nickname);
    nicknameInput.value = "";
    showToast("success", getResponseMessage(response, "친구 요청을 보냈습니다."));
    loadSentRequests({ silent: true });
  } catch (error) {
    showToast("error", getErrorMessage(error, "친구 요청을 보내지 못했습니다."));
  } finally {
    isSendingRequest.value = false;
  }
}

function isProcessingRequest(friendshipId, action) {
  return (
    processingRequestId.value === friendshipId &&
    processingRequestAction.value === action
  );
}

async function handleAcceptRequest(request) {
  if (processingRequestId.value !== null) return;
  processingRequestId.value = request.friendshipId;
  processingRequestAction.value = "accept";

  try {
    const response = await acceptFriendRequest(request.friendshipId);
    receivedRequests.value = receivedRequests.value.filter(
      (item) => item.friendshipId !== request.friendshipId,
    );
    await loadFriends();
    showToast("success", getResponseMessage(response, "친구 요청을 수락했습니다."));
  } catch (error) {
    showToast("error", getErrorMessage(error, "친구 요청을 수락하지 못했습니다."));
  } finally {
    processingRequestId.value = null;
    processingRequestAction.value = "";
  }
}

async function handleRejectRequest(request) {
  if (processingRequestId.value !== null) return;
  processingRequestId.value = request.friendshipId;
  processingRequestAction.value = "reject";

  try {
    const response = await rejectFriendRequest(request.friendshipId);
    receivedRequests.value = receivedRequests.value.filter(
      (item) => item.friendshipId !== request.friendshipId,
    );
    showToast("error", getResponseMessage(response, "친구 요청을 거절했습니다."));
  } catch (error) {
    showToast("error", getErrorMessage(error, "친구 요청을 거절하지 못했습니다."));
  } finally {
    processingRequestId.value = null;
    processingRequestAction.value = "";
  }
}

function handleOpenDeleteModal(friend) {
  if (deletingFriendId.value !== null) return;
  selectedFriend.value = friend;
  isDeleteModalOpen.value = true;
}

function handleCancelDelete() {
  selectedFriend.value = null;
}

async function handleDeleteFriend() {
  const friend = selectedFriend.value;
  if (!friend || deletingFriendId.value !== null) return;

  deletingFriendId.value = friend.userId;

  try {
    const response = await deleteFriend(friend.userId);
    friends.value = friends.value.filter(
      (item) => item.userId !== friend.userId,
    );
    showToast("error", getResponseMessage(response, "친구를 삭제했습니다."));
  } catch (error) {
    showToast("error", getErrorMessage(error, "친구를 삭제하지 못했습니다."));
  } finally {
    deletingFriendId.value = null;
    selectedFriend.value = null;
  }
}

function handleOpenCancelRequestModal(request) {
  if (cancellingFriendshipId.value !== null) return;
  selectedSentRequest.value = request;
  isCancelRequestModalOpen.value = true;
}

function handleDismissCancelRequestModal() {
  selectedSentRequest.value = null;
}

async function handleConfirmCancelRequest() {
  const request = selectedSentRequest.value;
  if (!request || cancellingFriendshipId.value !== null) return;

  cancellingFriendshipId.value = request.friendshipId;

  try {
    await cancelSentFriendRequest(request.friendshipId);
    // 로컬에서 바로 빼지 않고 서버를 다시 조회해 최종 목록을 맞춘다.
    await loadSentRequests();
    showToast("success", "친구 요청을 취소했어요.");
  } catch (error) {
    showToast(
      "error",
      getErrorMessage(error, "친구 요청을 취소하지 못했어요."),
    );
    await loadSentRequests({ silent: true });
  } finally {
    cancellingFriendshipId.value = null;
    selectedSentRequest.value = null;
  }
}

onMounted(async () => {
  await Promise.all([loadFriendData(), loadSentRequests()]);
  friendDataPollTimer = setInterval(pollFriendData, FRIEND_POLL_INTERVAL_MS);
  focusDeepLinkedSection();
});

onBeforeUnmount(() => {
  if (friendDataPollTimer !== null) {
    clearInterval(friendDataPollTimer);
    friendDataPollTimer = null;
  }
  if (highlightTimer !== null) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
});
</script>

<template>
  <BaseCard color="white">
    <form class="flex flex-col gap-4" @submit.prevent="handleSendRequest">
      <div class="flex flex-col gap-2">
        <h2 class="text-h2 text-ink">친구 추가</h2>
        <BaseTextField
          id="friend-nickname"
          v-model="nicknameInput"
          placeholder="친구 닉네임을 입력하세요"
          autocomplete="off"
        />
      </div>
      <BottomButton type="submit" :disabled="isSendingRequest">
        {{ isSendingRequest ? "요청 중" : "친구 요청" }}
      </BottomButton>
    </form>
  </BaseCard>

  <BaseCard color="white">
    <section
      ref="receivedSectionRef"
      class="rounded-2xl transition-colors duration-700"
      :class="highlightedSection === 'received' ? 'bg-pink-soft' : ''"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-2 py-1 text-left"
        :aria-expanded="isReceivedOpen"
        @click="isReceivedOpen = !isReceivedOpen"
      >
        <span class="flex items-center gap-2">
          <h2 class="text-h2 text-ink">받은 친구 요청</h2>
          <BasePill variant="ghost" :label="String(receivedRequests.length)" />
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-muted transition-transform duration-200"
          :class="isReceivedOpen ? 'rotate-180' : ''"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="grid transition-all duration-200 ease-out" :class="isReceivedOpen ? 'grid-rows-expand' : 'grid-rows-collapse'">
        <div class="min-h-0 overflow-hidden">
        <div class="flex flex-col gap-3 pt-3">
          <p v-if="isReceivedRequestsLoading" class="text-caption text-muted" role="status">
            받은 친구 요청을 불러오는 중입니다.
          </p>
          <p v-else-if="receivedRequestErrorMessage" class="text-caption text-error" role="alert">
            {{ receivedRequestErrorMessage }}
          </p>
          <p v-else-if="receivedRequests.length === 0" class="text-caption text-muted">
            새로운 친구 요청이 없어요.
          </p>
          <ul v-else class="flex flex-col divide-y divide-line-soft">
            <li
              v-for="request in receivedRequests"
              :key="request.friendshipId"
              class="flex items-center gap-3 py-3"
            >
              <span
                class="min-w-0 flex-1 truncate text-body font-semibold text-ink"
                :title="request.nickname"
              >
                {{ request.nickname }}
              </span>
              <div class="flex shrink-0 items-center gap-2">
                <BasePill
                  as="button"
                  type="button"
                  color="green"
                  :label="
                    isProcessingRequest(request.friendshipId, 'accept')
                      ? '처리 중'
                      : '수락'
                  "
                  :disabled="processingRequestId !== null"
                  @click="handleAcceptRequest(request)"
                />
                <BasePill
                  as="button"
                  type="button"
                  color="pink"
                  variant="outline"
                  :label="
                    isProcessingRequest(request.friendshipId, 'reject')
                      ? '처리 중'
                      : '거절'
                  "
                  :disabled="processingRequestId !== null"
                  @click="handleRejectRequest(request)"
                />
              </div>
            </li>
          </ul>
        </div>
        </div>
      </div>
    </section>
  </BaseCard>

  <BaseCard color="white">
    <section>
      <button
        type="button"
        class="flex w-full items-center justify-between gap-2 py-1 text-left"
        :aria-expanded="isSentOpen"
        @click="isSentOpen = !isSentOpen"
      >
        <span class="flex items-center gap-2">
          <h2 class="text-h2 text-ink">보낸 친구 요청</h2>
          <BasePill variant="ghost" :label="String(sentRequests.length)" />
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-muted transition-transform duration-200"
          :class="isSentOpen ? 'rotate-180' : ''"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="grid transition-all duration-200 ease-out" :class="isSentOpen ? 'grid-rows-expand' : 'grid-rows-collapse'">
        <div class="min-h-0 overflow-hidden">
        <div class="flex flex-col gap-3 pt-3">
          <p v-if="isSentRequestsLoading" class="text-caption text-muted" role="status">
            보낸 친구 요청을 불러오는 중입니다.
          </p>
          <p v-else-if="sentRequestErrorMessage" class="text-caption text-error" role="alert">
            {{ sentRequestErrorMessage }}
          </p>
          <p v-else-if="sentRequests.length === 0" class="text-caption text-muted">
            아직 보낸 친구 요청이 없어요.
          </p>
          <ul v-else class="flex flex-col divide-y divide-line-soft">
            <li
              v-for="request in sentRequests"
              :key="request.friendshipId"
              class="flex items-center gap-3 py-3"
            >
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <span
                  class="truncate text-body font-semibold text-ink"
                  :title="request.nickname"
                >
                  {{ request.nickname }}
                </span>
                <span class="text-caption text-muted">요청 대기 중</span>
              </div>
              <BasePill
                as="button"
                type="button"
                color="pink"
                variant="outline"
                class="shrink-0 active:bg-pink-soft"
                :label="cancellingFriendshipId === request.friendshipId ? '취소 중' : '요청 취소'"
                :disabled="cancellingFriendshipId !== null"
                @click="handleOpenCancelRequestModal(request)"
              />
            </li>
          </ul>
        </div>
        </div>
      </div>
    </section>
  </BaseCard>

  <BaseCard color="white">
    <section
      ref="friendsSectionRef"
      class="flex flex-col gap-3 rounded-2xl transition-colors duration-700"
      :class="highlightedSection === 'friends' ? 'bg-pink-soft' : ''"
    >
      <h2 class="text-h2 text-ink">내 친구</h2>

      <p v-if="isFriendsLoading" class="text-caption text-muted" role="status">
        친구 목록을 불러오는 중입니다.
      </p>
      <p v-else-if="friendListErrorMessage" class="text-caption text-error" role="alert">
        {{ friendListErrorMessage }}
      </p>
      <p v-else-if="friends.length === 0" class="text-caption text-muted">
        아직 등록된 친구가 없습니다.
      </p>
      <ul v-else class="flex flex-col divide-y divide-line-soft">
        <li
          v-for="friend in friends"
          :key="friend.userId"
          class="flex items-center gap-3 py-3"
        >
          <span
            class="min-w-0 flex-1 truncate text-body font-semibold text-ink"
            :title="friend.nickname"
          >
            {{ friend.nickname }}
          </span>
          <BasePill
            as="button"
            type="button"
            label="삭제"
            color="pink"
            variant="outline"
            :disabled="deletingFriendId !== null"
            @click="handleOpenDeleteModal(friend)"
          />
        </li>
      </ul>
    </section>
  </BaseCard>

  <BaseModal
    v-model="isDeleteModalOpen"
    :message="deleteConfirmationMessage"
    confirm-text="삭제"
    cancel-text="취소"
    @confirm="handleDeleteFriend"
    @cancel="handleCancelDelete"
  />

  <BaseModal
    v-model="isCancelRequestModalOpen"
    message="친구 요청을 취소할까요?"
    confirm-text="요청 취소"
    cancel-text="취소"
    :cancel-disabled="cancellingFriendshipId !== null"
    @confirm="handleConfirmCancelRequest"
    @cancel="handleDismissCancelRequestModal"
  >
    <template #content>
      <p class="text-center text-caption text-muted tracking-tight">
        상대방에게 보낸 친구 요청이 취소됩니다.
      </p>
    </template>
  </BaseModal>

  <BaseToast v-model="isToastVisible" :title="toastTitle" :variant="toastVariant" />
</template>
