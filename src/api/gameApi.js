import { get } from "@/api/http";

export function fetchGameStatus() {
  return get("/api/games/status");
}

export function fetchScenario(scenarioId) {
  return get(`/api/games/scenarios/${scenarioId}`);
}
