import { ApiError, get, post } from "@/api/http";

export class AccountApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AccountApiError";
    this.status = status;
  }
}

export async function createAccount({ seedMoney, monthlyInvestAmount }) {
  try {
    return await post("/api/accounts", { seedMoney, monthlyInvestAmount });
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
