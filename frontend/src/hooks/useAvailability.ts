"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface UnitAvailability {
  unit_id: string;
  unit_name: string;
  manager_name: string | null;
  attendants_count: number;
  pamphletists_count: number;
  analyst_name: string | null;
  availability_percent: number;
  status: string;
}

export interface AvailabilitySummary {
  total_units: number;
  units_complete: number;
  units_partial: number;
  units_critical: number;
  overall_efficiency: number;
}

export function useAvailability() {
  const [availability, setAvailability] = useState<UnitAvailability[]>([]);
  const [summary, setSummary] = useState<AvailabilitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>("/api/availability");
      // res.data contém a resposta da rota API
      const data = res.data;
      if (data) {
        setAvailability(data.units || []);
        setSummary({
          total_units: data.total_units || 0,
          units_complete: data.units_complete || 0,
          units_partial: data.units_partial || 0,
          units_critical: data.units_critical || 0,
          overall_efficiency: data.overall_efficiency || 0,
        });
      }
    } catch (e) {
      console.error("Error fetching availability:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    availability,
    summary,
    isLoading,
    refetch: fetchAvailability,
  };
}
