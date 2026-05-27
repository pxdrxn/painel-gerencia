// useAuth — Hook de autenticação
// TODO: Implementar
// - Login/logout
// - Estado do usuário atual
// - Refresh automático
// - Proteção de rotas (redirect para /login se não autenticado)

"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { setTokens, clearTokens, getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth(requireAuth = true) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get<{id: string, email: string, is_active: boolean, role: string, employee_id: string | null, name: string}>("/api/auth/me");
      setUser(res.data);
    } catch (e) {
      setUser(null);
      if (requireAuth) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [requireAuth, router]);

  useEffect(() => {
    if (getAccessToken()) {
      fetchUser();
    } else {
      setIsLoading(false);
      if (requireAuth) {
        router.push("/login");
      }
    }
  }, [fetchUser, requireAuth, router]);

  const login = async (email: string, password: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
        throw new Error("Credenciais inválidas");
    }
    
    const resJson = await res.json();
    // O backend retorna os tokens envelopados em success_response(data=...)
    const { access_token, refresh_token } = resJson.data;
    setTokens(access_token, refresh_token);
    await fetchUser();
    router.push("/dashboard");
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    router.push("/login");
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
}
