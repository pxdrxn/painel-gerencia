// useEmployees — Hook para gerenciar estado de funcionários
// TODO: Implementar
// - Fetch lista paginada
// - Create, update, delete
// - Filtros e busca

"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Employee {
  id: string;
  name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  unit_id: string;
  unit_name?: string;
  position: string;
  hire_date: string;
  salary: number;
  status: string;
  observations?: string | null;
  absences?: number;
  medical_leaves?: number;
  available_unit_ids?: string[];
}

interface EmployeesFilters {
  status?: string;
  unit_id?: string;
  skip?: number;
  limit?: number;
  search?: string;
}

export function useEmployees(initialFilters?: EmployeesFilters) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<EmployeesFilters>(initialFilters || { skip: 0, limit: 10 });

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const limit = filters.limit || 10;
      const pageNum = Math.floor((filters.skip || 0) / limit) + 1;
      const params: any = { page: pageNum, per_page: limit };
      if (filters.status) params.status = filters.status;
      if (filters.unit_id) params.unit_id = filters.unit_id;
      if (filters.search) params.query = filters.search;
      
      const res = await api.get<Employee[]>("/api/employees", params);
      setEmployees(res.data);
      setTotal(res.total || res.data.length);
    } catch (e) {
      console.error("Error fetching employees:", e);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const updateFilters = (newFilters: Partial<EmployeesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, skip: 0 }));
  };

  const setPage = (page: number) => {
    const limit = filters.limit || 10;
    setFilters(prev => ({ ...prev, skip: (page - 1) * limit }));
  };

  const createEmployee = async (employeeData: Omit<Employee, "id" | "salary" | "unit_name">) => {
    const res = await api.post<{ id: string }>("/api/employees", employeeData);
    await fetchEmployees();
    return res.data;
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    const res = await api.patch<{ id: string }>(`/api/employees/${id}`, employeeData);
    await fetchEmployees();
    return res.data;
  };

  const deleteEmployee = async (id: string) => {
    const res = await api.delete<void>(`/api/employees/${id}`);
    await fetchEmployees();
    return res.data;
  };

  return {
    employees,
    total,
    isLoading,
    filters,
    updateFilters,
    page: Math.floor((filters.skip || 0) / (filters.limit || 10)) + 1,
    setPage,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees,
  };
}
