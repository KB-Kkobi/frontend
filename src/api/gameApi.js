import { get, post } from "@/api/http";

export function fetchGameStatus() {
  return get("/api/games/status");
}

export function fetchScenario(scenarioId) {
  return get(`/api/games/scenarios/${scenarioId}`);
}

export function startGame({ cashRatio, stockRatio, depositRatio }) {
  return post("/api/games/start", {
    cashRatio,
    stockRatio,
    depositRatio,
  });
}

export function saveGameAction(gameAction) {
  return post("/api/games/actions", gameAction);
}

export function completeGame() {
  return post("/api/games/completion");
}
