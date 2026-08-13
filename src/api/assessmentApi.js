import { get } from "@/api/http";

const DEVELOPMENT_ASSESSMENT_RESULT = Object.freeze({
  rtScore: 78,
  lhScore: 42,
  rpScore: 84,
  persona: Object.freeze({
    personaName: "불꽃 추격자",
    feature: "적극적인 성장형 투자를 선호하는",
    description:
      "높은 기대수익을 추구하며 시장의 변화를 빠르게 포착하는 투자 성향이에요. 충분한 현금 여유를 두고 장기적인 기준을 함께 세우면 더 안정적으로 투자할 수 있어요.",
    strength: "기회를 빠르게 발견하고 적극적으로 실행해요.",
    caution: "단기 변동에 흔들리지 않도록 투자 기준을 정해 두세요.",
    imagePath: null,
    stockRatio: 60,
    bondRatio: 20,
    depositRatio: 20,
  }),
});

export async function fetchAssessmentResult() {
  try {
    const result = await get("/api/assessments/me/result");
    return import.meta.env.DEV && !result
      ? DEVELOPMENT_ASSESSMENT_RESULT
      : result;
  } catch (error) {
    if (import.meta.env.DEV) return DEVELOPMENT_ASSESSMENT_RESULT;
    throw error;
  }
}

export function fetchLatestAssessment() {
  return get("/api/assessments/me/latest");
}
