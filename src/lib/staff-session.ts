export const STAFF_TOKEN_KEY = "alenna_staff_token";

let memoryToken = "";

export function readStaffToken() {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined") return "";
  try {
    memoryToken =
      window.localStorage.getItem(STAFF_TOKEN_KEY) ||
      window.sessionStorage.getItem(STAFF_TOKEN_KEY) ||
      "";
  } catch {
    return memoryToken;
  }
  return memoryToken;
}

export function writeStaffToken(token: string) {
  memoryToken = token;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STAFF_TOKEN_KEY, token);
    window.sessionStorage.setItem(STAFF_TOKEN_KEY, token);
  } catch {
    // storage can be blocked inside some previews; memory token still works
  }
}

export function clearStaffToken() {
  memoryToken = "";
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STAFF_TOKEN_KEY);
    window.sessionStorage.removeItem(STAFF_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function staffHeaders(extra?: HeadersInit): HeadersInit {
  const token = readStaffToken();
  return {
    ...(extra || {}),
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
          "x-alenna-staff": token,
          "x-admin-token": token,
        }
      : {}),
  };
}

export async function staffFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = readStaffToken();
  let url = input;
  if (typeof input === "string" && token && (init.method === undefined || init.method === "GET")) {
    const join = input.includes("?") ? "&" : "?";
    url = `${input}${join}staff=${encodeURIComponent(token)}`;
  }
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: staffHeaders(init.headers),
    cache: "no-store",
  });
}
