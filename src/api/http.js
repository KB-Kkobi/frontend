import {
  clearAuthSession,
  getAuthorizationHeader,
  saveAuthSession,
} from "@/utils/authStorage";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const AUTH_REFRESH_PATH = "/api/auth/refresh";
let refreshRequest = null;

export function resolveApiUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = data?.error?.code ?? null;
    this.serverMessage = data?.error?.message ?? null;
  }
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!text) return null;

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

export async function refreshAccessToken() {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    const response = await fetch(`${API_BASE_URL}${AUTH_REFRESH_PATH}`, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await parseResponse(response);

    if (!response.ok || !data?.accessToken) {
      clearAuthSession();
      throw new ApiError("로그인이 만료되었습니다.", response.status, data);
    }

    saveAuthSession(data);
    return data;
  })().finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

async function request(
  path,
  options = {},
  { skipAuth = false, skipRefresh = false } = {},
) {
  let response;
  const headers = new Headers(options.headers);
  const authorization = skipAuth ? null : getAuthorizationHeader();

  if (authorization) headers.set("Authorization", authorization);

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("서버에 연결할 수 없습니다.", 0);
  }

  const data = await parseResponse(response);

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    await refreshAccessToken();
    return request(path, options, { skipAuth, skipRefresh: true });
  }

  if (!response.ok) {
    const message =
      data?.error?.message ?? data?.message ?? "요청을 처리하지 못했습니다.";
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

export function patch(path, body) {
  return request(path, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function remove(path) {
  return request(path, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
}
