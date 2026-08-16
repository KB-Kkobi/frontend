import { get, patch, post } from "@/api/http";

export function signupUser({ email, password, nickname, birthDate }) {
  return post(
    "/api/auth/signup",
    {
      email,
      password,
      nickname,
      birthDate,
    },
    { skipAuth: true },
  );
}

export function loginUser({ email, password }) {
  return post("/api/auth/login", { email, password }, { skipAuth: true });
}

export function logoutUser() {
  return post("/api/auth/logout", undefined, {
    skipAuth: true,
    skipRefresh: true,
  });
}

export function fetchMyInfo() {
  return get("/api/auth/me");
}

export function fetchMyProfile() {
  return get("/api/my/profile");
}

export function updateMyProfile({ nickname, birthDate }) {
  return patch("/api/my/profile", { nickname, birthDate });
}
