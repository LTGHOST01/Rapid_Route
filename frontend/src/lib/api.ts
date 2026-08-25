/** Same-origin `/api` so the browser never talks to :4000 (avoids leftover HTTPS/HSTS). */
export function apiBase() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && !fromEnv.includes("localhost:4000") && !fromEnv.includes("127.0.0.1:4000")) {
    return fromEnv.replace(/\/$/, "");
  }
  return "/api";
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function getToken() {
  return localStorage.getItem("rr_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("rr_token", token);
  else localStorage.removeItem("rr_token");
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (response.status === 401 && !path.startsWith("/auth/login")) {
    setToken(null);
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }

  if (!response.ok) {
    const message = data?.error?.message ?? `Request failed (${response.status})`;
    throw new ApiError(response.status, message, data);
  }
  return data as T;
}

export const endpoints = {
  health: () => api<import("../types").Health>("/health").catch(async () => {
    // health is also mounted without /api on the server; try via API prefix first
    throw new Error("health failed");
  }),
};
