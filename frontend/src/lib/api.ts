/**
 * API Client — Wrapper para fetch com JWT.
 *
 * Responsabilidades:
 * - Base URL configurável via env
 * - Attach JWT token automaticamente
 * - Refresh token em caso de 401
 * - Tipagem de responses
 *
 * Uso:
 *   import { api } from "@/lib/api";
 *   const employees = await api.get<Employee[]>("/employees");
 */

import { getAccessToken, isTokenExpired, refreshAccessToken, clearTokens } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any;
  total?: number;
  page?: number;
  per_page?: number;
}

async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();
  
  if (token && isTokenExpired(token)) {
    token = await refreshAccessToken();
    if (!token) {
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Sessão expirada. Faça login novamente.");
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      return fetch(url, { ...options, headers });
    } else {
      clearTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }
  
  return response;
}

export const api = {
  async get<T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let query = "";
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) query = `?${qs}`;
    }
    
    const res = await fetchWithAuth(`${path}${query}`, { method: "GET" });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao buscar dados");
    }
    return res.json();
  },
  
  async post<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    const res = await fetchWithAuth(path, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao enviar dados");
    }
    return res.json();
  },
  
  async patch<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    const res = await fetchWithAuth(path, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao atualizar dados");
    }
    return res.json();
  },
  
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const res = await fetchWithAuth(path, { method: "DELETE" });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao excluir dados");
    }
    return res.json();
  }
};
