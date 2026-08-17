<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  acceptFriendRequest,
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
const sentRequests = ref([]);
const sentRequestErrorMessage = ref("");
const isSentRequestsLoading = ref(false);
const isSentRequestsModalOpen = ref(false);

const deleteConfirmationMessage = computed(() =>
  selectedFriend.value
    ? `${selectedFriend.value.nickname}님을 친구 목록에서 삭제하시겠습니까?`
    : "친구를 삭제하시겠습니까?",
);

function formatSentAt(value) {
  if (!value) return "";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} 신청`;
}

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
// 100ms보다 더 줄이면 왕복시간(네트워크+서버 처리)보다 주기가 짧아져 의미가 없어진다.
const FRIEND_POLL_INTERVAL_MS = 100;
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

// 모달이 열려 있는 동안 상대방의 수락/거절이 자동으로 반영되도록 주기적으로 재조회한다.
let sentRequestsPollTimer = null;
let isSentRequestsPollInFlight = false;

function stopSentRequestsPolling() {
  if (sentRequestsPollTimer === null) return;
  clearInterval(sentRequestsPollTimer);
  sentRequestsPollTimer = null;
}

function startSentRequestsPolling() {
  stopSentRequestsPolling();
  sentRequestsPollTimer = setInterval(() => {
    if (isSentRequestsPollInFlight) return;
    isSentRequestsPollInFlight = true;
    loadSentRequests({ silent: true }).finally(() => {
      isSentRequestsPollInFlight = false;
    });
  }, FRIEND_POLL_INTERVAL_MS);
}

function handleOpenSentRequestsModal() {
  isSentRequestsModalOpen.value = true;
  loadSentRequests();
  startSentRequestsPolling();
}

watch(isSentRequestsModalOpen, (isOpen) => {
  if (!isOpen) stopSentRequestsPolling();
});

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

onMounted(() => {
  loadFriendData();
  friendDataPollTimer = setInterval(pollFriendData, FRIEND_POLL_INTERVAL_MS);
});

onBeforeUnmount(() => {
  if (friendDataPollTimer !== null) {
    clearInterval(friendDataPollTimer);
    friendDataPollTimer = null;
  }
  stopSentRequestsPolling();
});
</script>

<template>
  <BaseCard color="white">
    <div class="flex flex-col gap-6">
      <form class="flex flex-col gap-2" @submit.prevent="handleSendRequest">
        <BaseTextField
          id="friend-nickname"
          v-model="nicknameInput"
          label="친구 추가"
          placeholder="친구 닉네임을 입력하세요"
          autocomplete="off"
        />
        <BottomButton type="submit" :disabled="isSendingRequest">
          {{ isSendingRequest ? "요청 중" : "친구 요청" }}
        </BottomButton>
      </form>

      <section class="flex flex-col gap-2 border-t border-line pt-4">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-h2 text-ink">받은 친구 요청</h3>
          <BasePill
            as="button"
            type="button"
            label="보낸 신청 현황"
            variant="ghost"
            @click="handleOpenSentRequestsModal"
          />
        </div>

        <p
          v-if="isReceivedRequestsLoading"
          class="text-caption text-muted"
          role="status"
        >
          받은 친구 요청을 불러오는 중입니다.
        </p>
        <p
          v-else-if="receivedRequestErrorMessage"
          class="text-caption text-error"
          role="alert"
        >
          {{ receivedRequestErrorMessage }}
        </p>
        <p
          v-else-if="receivedRequests.length === 0"
          class="text-caption text-muted"
        >
          받은 친구 요청이 없습니다.
        </p>
        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="(request, index) in receivedRequests"
            :key="request.friendshipId"
            :class="[
              'flex items-center gap-2 py-3',
              index ? 'border-t border-line' : '',
            ]"
          >
            <span
              class="min-w-0 flex-1 truncate text-body font-semibold text-ink"
              :title="request.nickname"
            >
              {{ request.nickname }}
            </span>
            <div class="flex shrink-0 gap-2">
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
      </section>

      <section class="flex flex-col gap-2 border-t border-line pt-4">
        <h3 class="text-h2 text-ink">내 친구</h3>

        <p
          v-if="isFriendsLoading"
          class="text-caption text-muted"
          role="status"
        >
          친구 목록을 불러오는 중입니다.
        </p>
        <p
          v-else-if="friendListErrorMessage"
          class="text-caption text-error"
          role="alert"
        >
          {{ friendListErrorMessage }}
        </p>
        <p v-else-if="friends.length === 0" class="text-caption text-muted">
          아직 등록된 친구가 없습니다.
        </p>
        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="(friend, index) in friends"
            :key="friend.userId"
            :class="[
              'flex items-center gap-2 py-3',
              index ? 'border-t border-line' : '',
            ]"
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
    </div>
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
    v-model="isSentRequestsModalOpen"
    message="보낸 친구 신청"
    confirm-text="닫기"
    :show-cancel="false"
  >
    <template #content>
      <div class="flex flex-col gap-2">
        <p
          v-if="isSentRequestsLoading"
          class="text-caption text-muted"
          role="status"
        >
          보낸 친구 신청을 불러오는 중입니다.
        </p>
        <p
          v-else-if="sentRequestErrorMessage"
          class="text-caption text-error"
          role="alert"
        >
          {{ sentRequestErrorMessage }}
        </p>
        <p v-else-if="sentRequests.length === 0" class="text-caption text-muted">
          보낸 친구 신청이 없습니다.
        </p>
        <ul v-else class="flex max-h-64 flex-col gap-2 overflow-y-auto">
          <li
            v-for="(request, index) in sentRequests"
            :key="request.friendshipId"
            :class="[
              'flex items-center gap-2 py-2',
              index ? 'border-t border-line-soft' : '',
            ]"
          >
            <span
              class="min-w-0 flex-1 truncate text-body font-semibold text-ink"
              :title="request.nickname"
            >
              {{ request.nickname }}
            </span>
            <span class="shrink-0 text-caption text-muted">
              {{ formatSentAt(request.createdAt) }}
            </span>
          </li>
        </ul>
      </div>
    </template>
  </BaseModal>

  <BaseToast v-model="isToastVisible" :title="toastTitle" :variant="toastVariant" />
</template>
