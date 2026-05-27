"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface ProductionRanking {
  position: number;
  unit_id: string;
  unit_name: string;
  quantity: number;
}

export interface MonthlyProduction {
  year: number;
  month: number;
  total: number;
  growth_pct: number | null;
}

export interface ProductionSummary {
  year: number;
  month: number;
  total_quantity: number;
  unit_count: number;
  average_per_unit: number;
  growth_percentage: number | null;
}

export function useProduction(month: number, year: number) {
  const [ranking, setRanking] = useState<ProductionRanking[]>([]);
  const [monthly, setMonthly] = useState<MonthlyProduction[]>([]);
  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProduction = useCallback(async () => {
    setIsLoading(true);
    try {
      // Cria a query string de meses para o comparison endpoint (1 a 12)
      const monthsQuery = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        .map(m => `months=${m}`)
        .join("&");

      const [summaryRes, rankingRes, comparisonRes] = await Promise.all([
        api.get<ProductionSummary>(`/api/production?year=${year}&month=${month}`),
        api.get<ProductionRanking[]>(`/api/production/ranking?year=${year}&month=${month}`),
        api.get<MonthlyProduction[]>(`/api/production/comparison?year=${year}&${monthsQuery}`)
      ]);

      setSummary(summaryRes.data);
      setRanking(rankingRes.data || []);
      setMonthly(comparisonRes.data || []);
    } catch (e) {
      console.error("Error fetching production:", e);
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchProduction();
  }, [fetchProduction]);

  const saveProduction = async (unitId: string, quantity: number, observations?: string) => {
    const res = await api.post<{ id: string }>("/api/production", {
      unit_id: unitId,
      year,
      month,
      quantity,
      observations
    });
    await fetchProduction();
    return res.data;
  };

  return {
    ranking,
    monthly,
    summary,
    isLoading,
    saveProduction,
    refetch: fetchProduction,
  };
}
