import { ApiError, get, post } from "@/api/http";

export class AccountApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AccountApiError";
    this.status = status;
  }
}

// 초기 투자금은 서버에서 고정 지급하므로 요청 Body 없이 호출한다.
export async function createAccount() {
  try {
    return await post("/api/accounts");
  } catch (error) {
    if (error instanceof ApiError) {
      throw new AccountApiError(error.message, error.status);
    }
    throw error;
  }
}

export async function fetchAccountAssetStatus() {
  try {
    return await get("/api/accounts");
  } catch (error) {
    if (error instanceof ApiError) {
      throw new AccountApiError(error.message, error.status);
    }
    throw error;
  }
}
