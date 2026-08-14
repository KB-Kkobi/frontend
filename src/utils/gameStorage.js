const GAME_START_STORAGE_KEY = "kkobi-game-start";
const GAME_COMPLETION_STORAGE_KEY = "kkobi-game-completion";

function getSessionStorage() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveGameStartSession(gameStart) {
  try {
    getSessionStorage()?.setItem(
      GAME_START_STORAGE_KEY,
      JSON.stringify(gameStart),
    );
  } catch {}
}

export function readGameStartSession() {
  try {
    const storedGameStart = getSessionStorage()?.getItem(
      GAME_START_STORAGE_KEY,
    );
    return storedGameStart ? JSON.parse(storedGameStart) : null;
  } catch {
    return null;
  }
}

export function saveGameCompletionSession() {
  try {
    getSessionStorage()?.setItem(GAME_COMPLETION_STORAGE_KEY, "true");
  } catch {}
}

export function readGameCompletionSession() {
  try {
    return getSessionStorage()?.getItem(GAME_COMPLETION_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function clearGameCompletionSession() {
  try {
    getSessionStorage()?.removeItem(GAME_COMPLETION_STORAGE_KEY);
  } catch {}
}

export function clearGameSession() {
  try {
    const storage = getSessionStorage();
    storage?.removeItem(GAME_START_STORAGE_KEY);
    storage?.removeItem(GAME_COMPLETION_STORAGE_KEY);
  } catch {}
}
