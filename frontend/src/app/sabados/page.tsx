"use client";

import { useState, useEffect } from "react";
import { useSaturdayScales } from "@/hooks/useSaturdayScales";
import { useEmployees } from "@/hooks/useEmployees";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { FiPlus, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { cn } from "@/lib/utils";

// Helper to get the nearest upcoming Saturday date
const getNearestSaturday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
  const result = new Date(today);
  if (dayOfWeek !== 6) {
    result.setDate(today.getDate() + (6 - dayOfWeek + 7) % 7);
  }
  return result.toISOString().split("T")[0];
};

export default function SaturdayScalePage() {
  const [selectedDate, setSelectedDate] = useState(getNearestSaturday());
  const { scales, isLoading, fetchScales, addEmployeeToScale, updateScaleAction, removeEmployeeFromScale } = useSaturdayScales();
  const { employees, isLoading: loadingEmployees } = useEmployees({ limit: 100 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedAction, setSelectedAction] = useState<"folgou" | "largou_12h">("largou_12h");
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedDateObj = new Date(selectedDate + "T12:00:00");
  const isSaturday = selectedDateObj.getDay() === 6;

  useEffect(() => {
    if (isSaturday) {
      fetchScales(selectedDate);
    }
  }, [selectedDate, fetchScales, isSaturday]);

  const handleUpdateAction = async (scaleId: string, action: "folgou" | "largou_12h") => {
    try {
      await updateScaleAction(scaleId, selectedDate, action);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (scaleId: string) => {
    if (confirm("Deseja realmente remover este funcionário desta escala de sábado?")) {
      try {
        await removeEmployeeFromScale(scaleId, selectedDate);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setErrorMsg("Selecione um funcionário.");
      return;
    }

    setIsAdding(true);
    setErrorMsg("");

    try {
      await addEmployeeToScale(selectedEmployeeId, selectedDate, selectedAction);
      setIsModalOpen(false);
      setSelectedEmployeeId("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao adicionar funcionário na escala.");
    } finally {
      setIsAdding(false);
    }
  };

  // Filter out employees already on this Saturday's scale and only keep active employees
  const availableEmployees = employees.filter(
    (emp) => emp.status === "ativo" && !scales.some((s) => s.employee_id === emp.id)
  );

  const columns = [
    {
      key: "employee_name",
      label: "Colaborador",
      render: (val: string) => <span className="font-semibold text-gray-900">{val}</span>,
    },
    {
      key: "employee_position",
      label: "Cargo",
      render: (val: string) => <Badge status={val} variant="role" />,
    },
    {
      key: "unit_name",
      label: "Unidade Principal",
      render: (val: string) => <span className="text-gray-700 font-medium">{val}</span>,
    },
    {
      key: "action",
      label: "Escala do Sábado",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUpdateAction(row.id, "folgou")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
              val === "folgou"
                ? "bg-red-500 text-white border-red-500 shadow-sm"
                : "bg-white text-red-600 border-red-200 hover:bg-red-50"
            )}
          >
            FOLGOU
          </button>
          <button
            onClick={() => handleUpdateAction(row.id, "largou_12h")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
              val === "largou_12h"
                ? "bg-[#836FFF] text-white border-[#836FFF] shadow-sm"
                : "bg-white text-[#836FFF] border-purple-200 hover:bg-purple-50"
            )}
          >
            LARGOU DE 12:00
          </button>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      render: (_: any, row: any) => (
        <button
          onClick={() => handleRemove(row.id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remover da escala"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Escala de Sábados"
        subtitle="Gerenciamento operacional de horários e folgas exclusivo para sábados"
        action={
          isSaturday && (
            <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
              <FiPlus /> Adicionar Colaborador
            </Button>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase">Selecione o Sábado</label>
          <input
            type="date"
            className="block rounded-lg border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#836FFF] focus:ring-1 focus:ring-[#836FFF] text-gray-900 font-medium"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {!isSaturday && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-sm font-medium">A data selecionada não é um sábado. Escolha um sábado para gerenciar a escala.</span>
          </div>
        )}
      </div>

      {isSaturday && (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={scales}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Colaborador na Escala"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Colaborador Ativo *</label>
            <Select
              options={[
                { value: "", label: "Selecione um funcionário..." },
                ...availableEmployees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.name} (${emp.position})`,
                })),
              ]}
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              disabled={loadingEmployees}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Ação Inicial *</label>
            <Select
              options={[
                { value: "largou_12h", label: "LARGOU DE 12:00" },
                { value: "folgou", label: "FOLGOU" },
              ]}
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as any)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isAdding}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#F3E8FF] text-[#581C87] hover:bg-[#E9D5FF] border border-[#E9D5FF] font-semibold"
              loading={isAdding}
            >
              Confirmar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
