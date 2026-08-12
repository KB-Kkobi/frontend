<script setup>
import { computed, onMounted, ref } from "vue";
import {
  acceptFriendRequest,
  deleteFriend,
  fetchFriends,
  fetchReceivedFriendRequests,
  rejectFriendRequest,
  sendFriendRequest,
} from "@/api/friendApi";
import { ApiError } from "@/api/http";
import BaseCard from "@/components/common/BaseCard.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BasePill from "@/components/common/BasePill.vue";
import BaseTextField from "@/components/common/BaseTextField.vue";
import BottomButton from "@/components/common/BottomButton.vue";

const nicknameInput = ref("");
const receivedRequests = ref([]);
const friends = ref([]);
const receivedRequestErrorMessage = ref("");
const friendListErrorMessage = ref("");
const feedbackMessage = ref("");
const feedbackType = ref("");
const isReceivedRequestsLoading = ref(true);
const isFriendsLoading = ref(true);
const isSendingRequest = ref(false);
const processingRequestId = ref(null);
const processingRequestAction = ref("");
const deletingFriendId = ref(null);
const selectedFriend = ref(null);
const isDeleteModalOpen = ref(false);

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

function setFeedback(type, message) {
  feedbackType.value = type;
  feedbackMessage.value = message;
}

function clearFeedback() {
  feedbackType.value = "";
  feedbackMessage.value = "";
}

async function loadReceivedRequests() {
  isReceivedRequestsLoading.value = true;
  receivedRequestErrorMessage.value = "";

  try {
    const response = await fetchReceivedFriendRequests();
    receivedRequests.value = Array.isArray(response) ? response : [];
  } catch (error) {
    receivedRequestErrorMessage.value = getErrorMessage(
      error,
      "받은 친구 요청을 불러오지 못했습니다.",
    );
  } finally {
    isReceivedRequestsLoading.value = false;
  }
}

async function loadFriends() {
  isFriendsLoading.value = true;
  friendListErrorMessage.value = "";

  try {
    const response = await fetchFriends();
    friends.value = Array.isArray(response) ? response : [];
  } catch (error) {
    friendListErrorMessage.value = getErrorMessage(
      error,
      "친구 목록을 불러오지 못했습니다.",
    );
  } finally {
    isFriendsLoading.value = false;
  }
}

async function loadFriendData() {
  await Promise.all([loadReceivedRequests(), loadFriends()]);
}

async function handleSendRequest() {
  const nickname = nicknameInput.value.trim();
  clearFeedback();

  if (!nickname) {
    setFeedback("error", "친구 닉네임을 입력해 주세요.");
    return;
  }

  if (isSendingRequest.value) return;
  isSendingRequest.value = true;

  try {
    const response = await sendFriendRequest(nickname);
    nicknameInput.value = "";
    setFeedback(
      "success",
      getResponseMessage(response, "친구 요청을 보냈습니다."),
    );
  } catch (error) {
    setFeedback(
      "error",
      getErrorMessage(error, "친구 요청을 보내지 못했습니다."),
    );
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
  clearFeedback();
  processingRequestId.value = request.friendshipId;
  processingRequestAction.value = "accept";

  try {
    const response = await acceptFriendRequest(request.friendshipId);
    receivedRequests.value = receivedRequests.value.filter(
      (item) => item.friendshipId !== request.friendshipId,
    );
    await loadFriends();
    setFeedback(
      "success",
      getResponseMessage(response, "친구 요청을 수락했습니다."),
    );
  } catch (error) {
    setFeedback(
      "error",
      getErrorMessage(error, "친구 요청을 수락하지 못했습니다."),
    );
  } finally {
    processingRequestId.value = null;
    processingRequestAction.value = "";
  }
}

async function handleRejectRequest(request) {
  if (processingRequestId.value !== null) return;
  clearFeedback();
  processingRequestId.value = request.friendshipId;
  processingRequestAction.value = "reject";

  try {
    const response = await rejectFriendRequest(request.friendshipId);
    receivedRequests.value = receivedRequests.value.filter(
      (item) => item.friendshipId !== request.friendshipId,
    );
    setFeedback(
      "success",
      getResponseMessage(response, "친구 요청을 거절했습니다."),
    );
  } catch (error) {
    setFeedback(
      "error",
      getErrorMessage(error, "친구 요청을 거절하지 못했습니다."),
    );
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

  clearFeedback();
  deletingFriendId.value = friend.userId;

  try {
    const response = await deleteFriend(friend.userId);
    friends.value = friends.value.filter(
      (item) => item.userId !== friend.userId,
    );
    setFeedback(
      "success",
      getResponseMessage(response, "친구를 삭제했습니다."),
    );
  } catch (error) {
    setFeedback(
      "error",
      getErrorMessage(error, "친구를 삭제하지 못했습니다."),
    );
  } finally {
    deletingFriendId.value = null;
    selectedFriend.value = null;
  }
}

onMounted(loadFriendData);
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

      <div
        v-if="feedbackMessage"
        class="flex items-center justify-between gap-2"
      >
        <p
          :class="[
            'min-w-0 flex-1 text-caption',
            feedbackType === 'success' ? 'text-success' : 'text-error',
          ]"
          :role="feedbackType === 'success' ? 'status' : 'alert'"
        >
          {{ feedbackMessage }}
        </p>
        <BasePill
          as="button"
          type="button"
          label="확인"
          variant="ghost"
          @click="clearFeedback"
        />
      </div>

      <section class="flex flex-col gap-2 border-t border-line pt-4">
        <h3 class="text-h2 text-ink">받은 친구 요청</h3>

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
</template>
