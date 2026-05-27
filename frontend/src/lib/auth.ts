/**
 * Auth utilities — JWT storage e refresh logic.
 *
 * Responsabilidades:
 * - Armazenar tokens no localStorage
 * - Verificar expiração
 * - Refresh automático
 * - Login/Logout helpers
 */

const ACCESS_TOKEN_KEY = "sos_access_token";
const REFRESH_TOKEN_KEY = "sos_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }

  // Set cookies for SSR middleware access
  document.cookie = `${ACCESS_TOKEN_KEY}=${access}; path=/; max-age=1800; SameSite=Lax`;
  if (refresh) {
    document.cookie = `${REFRESH_TOKEN_KEY}=${refresh}; path=/; max-age=604800; SameSite=Lax`;
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  // Clear cookies
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function isTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp;
    return (Math.floor((new Date).getTime() / 1000)) >= expiry;
  } catch (e) {
    return true;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return null;
  }
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    
    if (!res.ok) {
      clearTokens();
      return null;
    }
    
    const data = await res.json();
    const newAccess = data.data.access_token;
    const newRefresh = data.data.refresh_token || refresh;
    setTokens(newAccess, newRefresh);
    return newAccess;
  } catch (e) {
    clearTokens();
    return null;
  }
}
