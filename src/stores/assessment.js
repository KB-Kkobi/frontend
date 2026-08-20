import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { fetchAssessmentResult } from "@/api/assessmentApi";

export const useAssessmentStore = defineStore("assessment", () => {
  const result = ref(null);
  const hasLoaded = ref(false);
  let inFlightRequest = null;

  const hasCompleted = computed(() => Boolean(result.value));

  async function loadResult() {
    if (hasLoaded.value) return result.value;
    if (inFlightRequest) return inFlightRequest;

    inFlightRequest = (async () => {
      try {
        result.value = await fetchAssessmentResult();
      } catch {
        result.value = null;
      } finally {
        hasLoaded.value = true;
        inFlightRequest = null;
      }
    })();

    return inFlightRequest;
  }

  function setResult(nextResult) {
    result.value = nextResult;
    hasLoaded.value = true;
  }

  function reset() {
    result.value = null;
    hasLoaded.value = false;
    inFlightRequest = null;
  }

  return {
    result,
    hasLoaded,
    hasCompleted,
    loadResult,
    setResult,
    reset,
  };
});
