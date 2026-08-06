import { getAuthorizationHeader } from "@/utils/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class AccountApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AccountApiError";
    this.status = status;
  }
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();

  const text = await response.text();
  return text || null;
}

export async function createAccount({ seedMoney, monthlyInvestAmount }) {
  const authorization = getAuthorizationHeader();
  const headers = { "Content-Type": "application/json" };
  if (authorization) headers.Authorization = authorization;

  const response = await fetch(`${API_BASE_URL}/api/accounts`, {
    method: "POST",
    headers,
    body: JSON.stringify({ seedMoney, monthlyInvestAmount }),
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.message
        ? data.message
        : "요청을 처리하지 못했습니다.";
    throw new AccountApiError(message, response.status);
  }

  return data;
}
