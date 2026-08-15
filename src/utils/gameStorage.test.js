import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearGameSession,
  readGameCompletionSession,
  readGameStartSession,
  saveGameCompletionSession,
  saveGameStartSession,
} from "@/utils/gameStorage";

function createSessionStorage() {
  const values = new Map();

  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, String(value))),
    removeItem: vi.fn((key) => values.delete(key)),
  };
}

describe("gameStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: createSessionStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears both the game start and completion sessions", () => {
    saveGameStartSession({ cashAmount: 1000, isCompleted: true });
    saveGameCompletionSession();

    clearGameSession();

    expect(readGameStartSession()).toBeNull();
    expect(readGameCompletionSession()).toBe(false);
  });
});
