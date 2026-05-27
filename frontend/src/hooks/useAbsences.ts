"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Absence {
  id: string;
  employee_id: string;
  employee_name: string | null;
  date: string;
  type: string; // folga | falta
  status: string; // agendada | confirmada | cancelada
  observations: string | null;
}

export function useAbsences() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAbsences = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Absence[]>("/api/absences");
      setAbsences(res.data || []);
    } catch (e) {
      console.error("Error fetching absences:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  const scheduleAbsence = async (absenceData: {
    employee_id: string;
    date: string;
    type: string;
    observations?: string;
  }) => {
    const res = await api.post<{ id: string }>("/api/absences", absenceData);
    await fetchAbsences();
    return res.data;
  };

  const updateAbsence = async (id: string, absenceData: {
    status?: string;
    observations?: string;
  }) => {
    const res = await api.patch<{ id: string }>(`/api/absences/${id}`, absenceData);
    await fetchAbsences();
    return res.data;
  };

  return {
    absences,
    isLoading,
    scheduleAbsence,
    updateAbsence,
    refetch: fetchAbsences,
  };
}
