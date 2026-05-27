"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface RetentionSummary {
  total_employees: number;
  average_tenure_months: number;
}

export interface RetentionBreakdown {
  label: string;
  count: number;
  percentage: number;
}

export function useRetention() {
  const [summary, setSummary] = useState<RetentionSummary | null>(null);
  const [breakdown, setBreakdown] = useState<RetentionBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRetention = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryRes, breakdownRes] = await Promise.all([
        api.get<any>("/api/retention/summary"),
        api.get<any>("/api/retention/breakdown")
      ]);
      
      const sData = summaryRes.data;
      if (sData) {
        setSummary({
          total_employees: sData.total_employees || 0,
          average_tenure_months: sData.average_retention_months || 0,
        });
      }

      const bData = breakdownRes.data;
      if (bData) {
        // Converte o objeto do backend { veterans, intermediate, recent } em um array para a tela
        const list: RetentionBreakdown[] = [];
        if (bData.veterans) {
          list.push({
            label: bData.veterans.label,
            count: bData.veterans.count,
            percentage: bData.veterans.percentage,
          });
        }
        if (bData.intermediate) {
          list.push({
            label: bData.intermediate.label,
            count: bData.intermediate.count,
            percentage: bData.intermediate.percentage,
          });
        }
        if (bData.recent) {
          list.push({
            label: bData.recent.label,
            count: bData.recent.count,
            percentage: bData.recent.percentage,
          });
        }
        setBreakdown(list);
      }
    } catch (e) {
      console.error("Error fetching retention:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRetention();
  }, [fetchRetention]);

  return {
    summary,
    breakdown,
    isLoading,
    refetch: fetchRetention,
  };
}
