"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Vacation {
  id: string;
  employee_id: string;
  employee_name: string | null;
  hire_date: string | null;
  start_date: string;
  end_date: string;
  status: string;
  observations: string | null;
}

export function useVacations() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [total, setTotal] = useState(0);
  const [onVacationCount, setOnVacationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVacations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>("/api/vacations");
      const data = res.data;
      if (data) {
        setVacations(data.vacations || []);
        setTotal(data.total || 0);
        setOnVacationCount(data.on_vacation_count || 0);
      }
    } catch (e) {
      console.error("Error fetching vacations:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVacations();
  }, [fetchVacations]);

  const scheduleVacation = async (vacationData: {
    employee_id: string;
    start_date: string;
    end_date: string;
    observations?: string;
  }) => {
    const res = await api.post<{ id: string }>("/api/vacations", vacationData);
    await fetchVacations();
    return res.data;
  };

  const updateVacation = async (id: string, vacationData: {
    start_date?: string;
    end_date?: string;
    status?: string;
    observations?: string;
  }) => {
    const res = await api.patch<{ id: string }>(`/api/vacations/${id}`, vacationData);
    await fetchVacations();
    return res.data;
  };

  const completeVacation = async (id: string) => {
    const res = await api.post<{ id: string }>(`/api/vacations/${id}/complete`, {});
    await fetchVacations();
    return res.data;
  };

  const deleteVacation = async (id: string) => {
    const res = await api.delete<void>(`/api/vacations/${id}`);
    await fetchVacations();
    return res.data;
  };

  return {
    vacations,
    total,
    onVacationCount,
    isLoading,
    scheduleVacation,
    updateVacation,
    completeVacation,
    deleteVacation,
    refetch: fetchVacations,
  };
}
