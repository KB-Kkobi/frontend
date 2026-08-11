import { get } from "@/api/http";

export function fetchAssessmentResult() {
  return get("/api/assessments/me/result");
}