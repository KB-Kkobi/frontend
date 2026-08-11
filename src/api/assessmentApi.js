import { get } from "@/api/http";

export function fetchLatestAssessment() {
  return get("/api/assessments/me/latest");
}
