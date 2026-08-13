import { get } from "@/api/http";

const LEADERBOARD_PATH = "/api/leaderboard";

export function fetchPersonaLeaderboard() {
  return get(`${LEADERBOARD_PATH}/persona`);
}

export function fetchFriendLeaderboard() {
  return get(`${LEADERBOARD_PATH}/friends`);
}
