const AUTH_STORAGE_KEY = "kkobi-auth";
let cachedSession = null;
let isSessionLoaded = false;

function getStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readAuthSession() {
  if (isSessionLoaded) return cachedSession;

  isSessionLoaded = true;
  const storage = getStorage();
  if (!storage) return null;

  try {
    const storedSession = storage.getItem(AUTH_STORAGE_KEY);
    cachedSession = storedSession ? JSON.parse(storedSession) : null;
  } catch {
    try {
      storage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // 저장소 접근이 차단된 환경에서는 메모리 상태만 사용합니다.
    }
    cachedSession = null;
  }

  return cachedSession;
}

export function saveAuthSession(session) {
  cachedSession = session;
  isSessionLoaded = true;

  try {
    getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // 저장소 접근 실패가 로그인 자체를 막지 않도록 합니다.
  }
}

export function clearAuthSession() {
  cachedSession = null;
  isSessionLoaded = true;

  try {
    getStorage()?.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // 저장소가 비활성화된 환경에서도 로그아웃 상태는 유지됩니다.
  }
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
