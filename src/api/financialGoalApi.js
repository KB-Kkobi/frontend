import { get, put, remove } from "@/api/http";

const FINANCIAL_GOAL_API_PATH = "/api/financial-goals";

export function fetchFinancialGoal() {
  return get(FINANCIAL_GOAL_API_PATH);
}

export function saveFinancialGoal(goal) {
  return put(FINANCIAL_GOAL_API_PATH, goal);
}

export function deleteFinancialGoal() {
  return remove(FINANCIAL_GOAL_API_PATH);
}

export function fetchFinancialGoalRecommendations(params = {}) {
  const query = new URLSearchParams();
  if (params.productType) query.set("productType", params.productType);
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  const suffix = query.size ? `?${query.toString()}` : "";
  return get(`${FINANCIAL_GOAL_API_PATH}/recommendations${suffix}`);
}
