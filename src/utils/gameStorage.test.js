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

git   it("clears the saved game state on logout cleanup", () => {
    saveGameStartSession({ cashAmount: 1000, isCompleted: false });

    clearGameSession();

    expect(readGameStartSession()).toBeNull();
  });

  it("clears the completed game state on logout cleanup", () => {
    saveGameCompletionSession();

    clearGameSession();

    expect(readGameCompletionSession()).toBe(false);
  });

  it("does not restore the previous account's game state after account switch", () => {
    saveGameStartSession({ cashAmount: 1000, isCompleted: true });
    saveGameCompletionSession();

    clearGameSession();

    expect(readGameStartSession()).toBeNull();
    expect(readGameCompletionSession()).toBe(false);
  });
});
