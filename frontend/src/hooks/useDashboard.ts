// useDashboard — Hook para carregar métricas do dashboard
// TODO: Implementar
// - Fetch GET /api/dashboard/metrics
// - Auto-refresh periódico (opcional)

"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface DashboardMetrics {
  total_employees: number;
  total_units: number;
  on_vacation: number;
  recent_hires: number;
  active_employees: number;
  monthly_goal_pct: number;
  efficiency: number;
  efficiency_label: string;
  production_total_month: number;
  production_growth_pct: number | null;
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<DashboardMetrics>("/api/dashboard/metrics");
      setMetrics(res.data);
    } catch (e) {
      console.error("Error fetching dashboard metrics:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    refetch: fetchMetrics,
  };
}
