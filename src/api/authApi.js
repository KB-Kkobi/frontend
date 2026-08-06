import { post } from "@/api/http";

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
