"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface DayBreakdownItem {
  date: string;
  day_of_week: number;
  day_name: string;
  is_workday: boolean;
  occurrence: string; // normal | sabado_escala | sabado_meiodia | sabado_folga | falta | folga | ferias | domingo
  rate_factor: number;
  notes: string | null;
}

export interface DailyRatePreviewResponse {
  employee_id: string;
  employee_name: string | null;
  employee_position: string | null;
  employee_cpf: string | null;
  employee_cnpj: string | null;
  unit_name: string | null;
  start_date: string;
  end_date: string;
  total_calendar_days: number;
  total_workdays_scheduled: number;
  absences_deducted: number;
  vacations_deducted: number;
  saturday_half_days: number;
  effective_days_count: number;
  daily_value: number;
  subtotal_value: number;
  additions_value: number;
  discounts_value: number;
  total_value: number;
  breakdown: DayBreakdownItem[];
}

export interface DailyRateRecord {
  id: string;
  employee_id: string;
  employee_name: string | null;
  employee_position: string | null;
  employee_cpf: string | null;
  employee_cnpj: string | null;
  unit_name: string | null;
  start_date: string;
  end_date: string;
  daily_value: number;
  days_count: number;
  total_value: number;
  rule_type: string;
  work_saturdays: boolean;
  discount_absences: boolean;
  discount_vacations: boolean;
  absences_deducted: number;
  vacations_deducted: number;
  saturday_half_days: number;
  additions_value: number;
  discounts_value: number;
  status: string; // pendente | aprovado | pago | cancelado
  payment_date: string | null;
  notes: string | null;
  details_breakdown: DayBreakdownItem[];
  created_at: string;
  updated_at: string;
}

export interface PreviewParams {
  employee_id: string;
  start_date: string;
  end_date: string;
  daily_value: number;
  rule_type?: string;
  work_saturdays?: boolean;
  discount_absences?: boolean;
  discount_vacations?: boolean;
  additions_value?: number;
  discounts_value?: number;
  custom_overrides?: Record<string, number>;
}

export interface CreateDailyRateParams {
  employee_id: string;
  start_date: string;
  end_date: string;
  daily_value: number;
  days_count: number;
  total_value: number;
  rule_type?: string;
  work_saturdays?: boolean;
  discount_absences?: boolean;
  discount_vacations?: boolean;
  absences_deducted?: number;
  vacations_deducted?: number;
  saturday_half_days?: number;
  additions_value?: number;
  discounts_value?: number;
  status?: string;
  payment_date?: string | null;
  notes?: string | null;
  details_breakdown?: DayBreakdownItem[];
}

export function useDailyRates() {
  const [dailyRates, setDailyRates] = useState<DailyRateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDailyRates = useCallback(async (filters?: { employee_id?: string; status?: string; start_date?: string; end_date?: string }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.employee_id) params.append("employee_id", filters.employee_id);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.start_date) params.append("start_date", filters.start_date);
      if (filters?.end_date) params.append("end_date", filters.end_date);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get<DailyRateRecord[]>(`/api/daily-rates${qs}`);
      setDailyRates(res.data || []);
    } catch (e) {
      console.error("Erro ao buscar histórico de diárias:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyRates();
  }, [fetchDailyRates]);

  const calculatePreview = async (params: PreviewParams): Promise<DailyRatePreviewResponse> => {
    const res = await api.post<DailyRatePreviewResponse>("/api/daily-rates/preview", params);
    return res.data;
  };

  const createDailyRate = async (data: CreateDailyRateParams): Promise<DailyRateRecord> => {
    const res = await api.post<DailyRateRecord>("/api/daily-rates", data);
    await fetchDailyRates();
    return res.data;
  };

  const updateDailyRate = async (id: string, data: Partial<DailyRateRecord>): Promise<DailyRateRecord> => {
    const res = await api.patch<DailyRateRecord>(`/api/daily-rates/${id}`, data);
    await fetchDailyRates();
    return res.data;
  };

  const deleteDailyRate = async (id: string): Promise<void> => {
    await api.delete(`/api/daily-rates/${id}`);
    await fetchDailyRates();
  };

  return {
    dailyRates,
    isLoading,
    fetchDailyRates,
    calculatePreview,
    createDailyRate,
    updateDailyRate,
    deleteDailyRate,
    refetch: fetchDailyRates,
  };
}
