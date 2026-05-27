"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Unit {
  id: string;
  name: string;
  is_active: boolean;
  address: string | null;
  phone: string | null;
  manager_id: string | null;
}

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnits = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Unit[]>("/api/units");
      setUnits(res.data);
    } catch (e) {
      console.error("Error fetching units:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const createUnit = async (unitData: any) => {
    const res = await api.post<{ id: string; name: string }>("/api/units", unitData);
    await fetchUnits();
    return res.data;
  };

  const updateUnit = async (id: string, unitData: any) => {
    const res = await api.patch<{ id: string }>(`/api/units/${id}`, unitData);
    await fetchUnits();
    return res.data;
  };

  const deleteUnit = async (id: string) => {
    const res = await api.delete<void>(`/api/units/${id}`);
    await fetchUnits();
    return res.data;
  };

  return {
    units,
    isLoading,
    createUnit,
    updateUnit,
    deleteUnit,
    refetch: fetchUnits,
  };
}
