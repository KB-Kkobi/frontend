import { get, patch, post, remove } from "@/api/http";

const FRIENDS_PATH = "/api/friends";

export function sendFriendRequest(nickname) {
  return post(`${FRIENDS_PATH}/requests`, { nickname });
}

export function fetchReceivedFriendRequests() {
  return get(`${FRIENDS_PATH}/requests/received`);
}

export function fetchSentFriendRequests() {
  return get(`${FRIENDS_PATH}/requests/sent`);
}

export function acceptFriendRequest(friendshipId) {
  return patch(`${FRIENDS_PATH}/requests/${friendshipId}/accept`);
}

export function rejectFriendRequest(friendshipId) {
  return patch(`${FRIENDS_PATH}/requests/${friendshipId}/reject`);
}

export function fetchFriends() {
  return get(FRIENDS_PATH);
}

export function deleteFriend(friendUserId) {
  return remove(`${FRIENDS_PATH}/${friendUserId}`);
}
