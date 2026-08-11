const GAME_START_STORAGE_KEY = "kkobi-game-start";

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
