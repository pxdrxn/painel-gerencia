"use client";

import { useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { FiDollarSign, FiEdit2 } from "react-icons/fi";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function RescisionPage() {
  const { employees, isLoading, updateEmployee, refetch } = useEmployees({ limit: 100 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const [rescisionType, setRescisionType] = useState("");
  const [rescisionValue, setRescisionValue] = useState("");
  const [rescisionStatus, setRescisionStatus] = useState("pendente");
  const [rescisionNotes, setRescisionNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const demittedEmployees = employees.filter(
    (emp) => emp.status === "inativo" || !!emp.termination_date
  );

  const handleOpenModal = (emp: any) => {
    setSelectedEmployee(emp);
    setRescisionType(emp.rescision_type || "sem_justa_causa");
    setRescisionValue(emp.rescision_value ? emp.rescision_value.toString() : "");
    setRescisionStatus(emp.rescision_status || "pendente");
    setRescisionNotes(emp.rescision_notes || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setIsSaving(true);
    setErrorMsg("");

    try {
      const val = parseFloat(rescisionValue) || 0;
      await updateEmployee(selectedEmployee.id, {
        rescision_type: rescisionType,
        rescision_value: val,
        rescision_status: rescisionStatus,
        rescision_notes: rescisionNotes,
      });
      await refetch();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar dados de rescisão.");
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
      key: "termination_date",
      label: "Data Demissão",
      render: (val: string) => val ? formatDate(val) : "—",
    },
    {
      key: "cnpj",
      label: "CNPJ",
      render: (val: string) => val || "—",
    },
    {
      key: "rescision_type",
      label: "Tipo",
      render: (val: string) => {
        const labels: Record<string, string> = {
          sem_justa_causa: "Sem Justa Causa",
          com_justa_causa: "Com Justa Causa",
          pedido: "Pedido de Demissão",
          acordo: "Acordo Consensual",
        };
        return labels[val] || val || "—";
      },
    },
    {
      key: "rescision_status",
      label: "Status",
      render: (val: string) => {
        if (!val) return <Badge status="cancelada" />; // will render gray
        return <Badge status={val === "pago" ? "confirmada" : "afastado"} />; // green for pago, yellow for pendente
      },
    },
    {
      key: "rescision_value",
      label: "Valor Rescisão",
      render: (val: number) => val ? formatCurrency(val) : "—",
    },
    {
      key: "rescision_notes",
      label: "Observações",
      render: (val: string) => (
        <span className="text-gray-500 text-xs max-w-[220px] whitespace-normal break-words block">
          {val || "—"}
        </span>
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
          <FiEdit2 className="w-3.5 h-3.5" /> Informar Rescisão
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Controle de Rescisões"
        subtitle="Gerencie e informe os valores pagos a colaboradores desligados"
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={demittedEmployees}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Informações de Rescisão — ${selectedEmployee?.name}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Rescisão *"
              options={[
                { value: "sem_justa_causa", label: "Sem Justa Causa" },
                { value: "com_justa_causa", label: "Com Justa Causa" },
                { value: "pedido", label: "Pedido de Demissão" },
                { value: "acordo", label: "Acordo Consensual" },
              ]}
              value={rescisionType}
              onChange={(e) => setRescisionType(e.target.value)}
              required
            />

            <Select
              label="Status de Pagamento *"
              options={[
                { value: "pendente", label: "Pendente" },
                { value: "pago", label: "Pago" },
              ]}
              value={rescisionStatus}
              onChange={(e) => setRescisionStatus(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Valor da Rescisão (R$)</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-8 w-full"
                value={rescisionValue}
                onChange={(e) => setRescisionValue(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Observações / Detalhes</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#836FFF] focus:ring-1 focus:ring-[#836FFF] text-gray-900"
              rows={3}
              value={rescisionNotes}
              onChange={(e) => setRescisionNotes(e.target.value)}
              placeholder="Ex: chaves Pix de pagamento, data da homologação, etc..."
            />
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
              Salvar Lançamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
