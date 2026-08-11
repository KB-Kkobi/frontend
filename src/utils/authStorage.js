let cachedSession = null;
const sessionListeners = new Set();

function notifySessionChange() {
  sessionListeners.forEach((listener) => listener(cachedSession));
}

function normalizeSession(session) {
  if (!session?.accessToken) return null;

  return {
    accessToken: session.accessToken,
    tokenType: session.tokenType || "Bearer",
    accessTokenExpiresAt: session.accessTokenExpiresAt,
  };
}

function clearLegacyAuthSession() {
  try {
    window.localStorage.removeItem("kkobi-auth");
  } catch {
    // 저장소 접근이 차단된 환경에서는 메모리 세션만 사용
  }
}

export function readAuthSession() {
  return cachedSession;
}

export function saveAuthSession(session) {
  cachedSession = normalizeSession(session);
  notifySessionChange();
}

export function clearAuthSession() {
  cachedSession = null;
  notifySessionChange();
}

export function subscribeAuthSession(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function getAuthorizationHeader() {
  const session = readAuthSession();
  if (!session?.accessToken) return null;
  if (
    session.accessTokenExpiresAt &&
    session.accessTokenExpiresAt <= Date.now()
  ) {
    return null;
  }

  const tokenType = session.tokenType || "Bearer";
  return `${tokenType} ${session.accessToken}`;
}

clearLegacyAuthSession();
