"use client";

import { useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { FiEdit2, FiHash, FiSearch } from "react-icons/fi";

export default function CnpjPage() {
  const { employees, isLoading, updateEmployee, refetch, filters, updateFilters } = useEmployees({ limit: 100 });
  const [searchInput, setSearchInput] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [cnpjValue, setCnpjValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const formatCNPJInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  const handleOpenModal = (emp: any) => {
    setSelectedEmployee(emp);
    setCnpjValue(emp.cnpj || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setIsSaving(true);
    setErrorMsg("");

    try {
      const formattedCnpj = cnpjValue.trim() || null;
      await updateEmployee(selectedEmployee.id, {
        cnpj: formattedCnpj,
      });
      await refetch();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar CNPJ.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Colaborador",
      render: (val: string) => <span className="font-semibold text-gray-900">{val}</span>,
    },
    {
      key: "position",
      label: "Cargo",
      render: (val: string) => <Badge status={val} variant="role" />,
    },
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
      },
    },
    {
      key: "cnpj",
      label: "CNPJ",
      render: (val: string) => (
        <span className="font-mono text-gray-700 font-semibold">{val || "—"}</span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      render: (_: any, row: any) => (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-purple-200 text-[#836FFF] hover:bg-purple-50"
          onClick={() => handleOpenModal(row)}
        >
          <FiEdit2 className="w-3.5 h-3.5" /> Editar CNPJ
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Controle de CNPJ"
        subtitle="Gerencie e associe o CNPJ dos colaboradores da S.O.S Crédito"
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
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Vincular CNPJ — ${selectedEmployee?.name}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">CNPJ do Colaborador</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiHash className="text-gray-400 w-4 h-4" />
              </div>
              <Input
                type="text"
                placeholder="00.000.000/0000-00"
                className="pl-9 w-full font-mono"
                value={cnpjValue}
                onChange={(e) => setCnpjValue(formatCNPJInput(e.target.value))}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Deixe em branco para remover o CNPJ associado.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#F3E8FF] text-[#581C87] hover:bg-[#E9D5FF] border border-[#E9D5FF] font-semibold"
              loading={isSaving}
            >
              Salvar Alteração
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
