import { ApiError, get, post } from "@/api/http";

export class QuizApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "QuizApiError";
    this.status = status;
  }
}

export async function fetchTodayQuiz() {
  try {
    return await get("/api/quizzes/today");
  } catch (error) {
    if (error instanceof ApiError) {
      throw new QuizApiError(error.message, error.status);
    }
    throw error;
  }
}

export async function submitQuizAnswer(answer) {
  try {
    return await post("/api/quizzes/today/answer", { answer });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new QuizApiError(error.message, error.status);
    }
    throw error;
  }
}