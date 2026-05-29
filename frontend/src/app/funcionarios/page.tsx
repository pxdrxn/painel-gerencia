"use client";

import { useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { FiPlus, FiSearch, FiMinus } from "react-icons/fi";
import Link from "next/link";

export default function EmployeesPage() {
  const [searchInput, setSearchInput] = useState("");
  const { employees, total, isLoading, filters, updateFilters, page, setPage, updateEmployee } = useEmployees();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handleIncrement = async (id: string, field: "absences" | "medical_leaves", currentVal: number) => {
    setUpdatingId(id);
    try {
      await updateEmployee(id, { [field]: currentVal + 1 });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDecrement = async (id: string, field: "absences" | "medical_leaves", currentVal: number) => {
    if (currentVal <= 0) return;
    setUpdatingId(id);
    try {
      await updateEmployee(id, { [field]: currentVal - 1 });
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    { 
      key: "name", 
      label: "Nome",
      render: (val: string) => {
        return (
          <span className="font-semibold text-gray-900">
            {val}
          </span>
        );
      }
    },
    { key: "position", label: "Cargo", render: (val: string) => <Badge status={val} variant="role" /> },
    { 
      key: "status", 
      label: "Status", 
      render: (val: string, row: any) => {
        const isCurrentlyInativo = val === "inativo" || !!row.termination_date;
        if (isCurrentlyInativo) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-wider">
              Inativo
            </span>
          );
        }
        return <Badge status={val} />;
      }
    },
    { key: "start_date", label: "Início", render: (val: string) => val ? formatDate(val) : "—" },
    { key: "hire_date", label: "Contratação", render: (val: string) => formatDate(val) },
    { key: "termination_date", label: "Demissão", render: (val: string) => val ? formatDate(val) : "—" },
    {
      key: "absences",
      label: "Falta",
      render: (val: number, row: any) => (
        <div className="flex items-center gap-1">
          <button
            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors text-gray-500 disabled:opacity-40"
            onClick={() => handleDecrement(row.id, "absences", val || 0)}
            disabled={updatingId === row.id || (val || 0) <= 0}
          >
            <FiMinus className="w-3 h-3" />
          </button>
          <span className="min-w-[24px] text-center font-semibold text-gray-900 text-sm">{val || 0}</span>
          <button
            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-purple-50 hover:text-[#836FFF] flex items-center justify-center transition-colors text-gray-500 disabled:opacity-40"
            onClick={() => handleIncrement(row.id, "absences", val || 0)}
            disabled={updatingId === row.id}
          >
            <FiPlus className="w-3 h-3" />
          </button>
        </div>
      ),
    },
    {
      key: "medical_leaves",
      label: "Atestados",
      render: (val: number, row: any) => (
        <div className="flex items-center gap-1">
          <button
            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors text-gray-500 disabled:opacity-40"
            onClick={() => handleDecrement(row.id, "medical_leaves", val || 0)}
            disabled={updatingId === row.id || (val || 0) <= 0}
          >
            <FiMinus className="w-3 h-3" />
          </button>
          <span className="min-w-[24px] text-center font-semibold text-gray-900 text-sm">{val || 0}</span>
          <button
            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-purple-50 hover:text-[#836FFF] flex items-center justify-center transition-colors text-gray-500 disabled:opacity-40"
            onClick={() => handleIncrement(row.id, "medical_leaves", val || 0)}
            disabled={updatingId === row.id}
          >
            <FiPlus className="w-3 h-3" />
          </button>
        </div>
      ),
    },
    {
      key: "observations",
      label: "Observações",
      render: (val: string) => <span className="text-gray-600 text-xs max-w-[250px] truncate block" title={val}>{val || "—"}</span>
    },
    {
      key: "actions",
      label: "Ações",
      render: (_: any, row: any) => (
        <Link href={`/funcionarios/${row.id}`}>
          <Button size="sm" variant="outline">
            Editar
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Funcionários" 
        subtitle="Gerencie os colaboradores da S.O.S Crédito"
        action={
          <Link href="/funcionarios/novo">
            <Button className="gap-2">
              <FiPlus /> Novo Funcionário
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between rounded-t-xl">
            <form onSubmit={handleSearch} className="flex-1 max-w-md w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <Input 
                type="text" 
                placeholder="Buscar por nome..." 
                className="pl-10 w-full"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
            <div className="flex gap-4 w-full sm:w-auto">
              <Select 
                options={[
                  { value: "", label: "Todos os Status" },
                  { value: "ativo", label: "Ativo" },
                  { value: "ferias", label: "Férias" },
                  { value: "inativo", label: "Inativo" },
                ]}
                value={filters.status || ""}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="w-full sm:w-40"
              />
            </div>
          </div>
          
          <DataTable 
            columns={columns} 
            data={employees} 
            pagination={{
              page,
              per_page: filters.limit || 10,
              total,
              total_pages: Math.ceil(total / (filters.limit || 10)) || 1
            }}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
