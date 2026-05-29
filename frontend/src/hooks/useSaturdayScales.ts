"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface SaturdayScaleEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_position: string;
  unit_name: string;
  date: string;
  action: "folgou" | "largou_12h";
}

export function useSaturdayScales() {
  const [scales, setScales] = useState<SaturdayScaleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScales = useCallback(async (dateStr: string) => {
    if (!dateStr) return;
    setIsLoading(true);
    try {
      const res = await api.get<SaturdayScaleEntry[]>("/api/saturday-scales", { date: dateStr });
      setScales(res.data || []);
    } catch (e) {
      console.error("Error fetching Saturday scales:", e);
      setScales([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEmployeeToScale = async (employeeId: string, dateStr: string, action: "folgou" | "largou_12h" = "largou_12h") => {
    const res = await api.post<{ id: string }>("/api/saturday-scales", {
      employee_id: employeeId,
      date: dateStr,
      action: action,
    });
    await fetchScales(dateStr);
    return res.data;
  };

  const updateScaleAction = async (scaleId: string, dateStr: string, action: "folgou" | "largou_12h") => {
    const res = await api.patch<{ id: string }>(`/api/saturday-scales/${scaleId}`, {
      action: action,
    });
    await fetchScales(dateStr);
    return res.data;
  };

  const removeEmployeeFromScale = async (scaleId: string, dateStr: string) => {
    const res = await api.delete<void>(`/api/saturday-scales/${scaleId}`);
    await fetchScales(dateStr);
    return res.data;
  };

  return {
    scales,
    isLoading,
    fetchScales,
    addEmployeeToScale,
    updateScaleAction,
    removeEmployeeFromScale,
  };
}
