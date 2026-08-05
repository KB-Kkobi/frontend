import { get } from "@/api/http";

export function fetchScenario(scenarioId) {
  return get(`/api/games/scenarios/${scenarioId}`);
}
