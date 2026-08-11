import { get } from "@/api/http";

export function fetchPersonas() {
  return get("/api/personas");
}
