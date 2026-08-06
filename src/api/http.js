import { getAuthorizationHeader } from "@/utils/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();

  const text = await response.text();
  return text || null;
}

async function request(path, options = {}, { skipAuth = false } = {}) {
  let response;
  const headers = new Headers(options.headers);
  const authorization = skipAuth ? null : getAuthorizationHeader();

  if (authorization) headers.set("Authorization", authorization);

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError("서버에 연결할 수 없습니다.", 0);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.message
        ? data.message
        : "요청을 처리하지 못했습니다.";
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export function get(path) {
  return request(path, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
}

export function post(path, body, requestOptions) {
  return request(
    path,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    requestOptions,
  );
}
