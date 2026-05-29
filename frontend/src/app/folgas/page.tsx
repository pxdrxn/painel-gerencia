"use client";

import { useState } from "react";
import { useAbsences } from "@/hooks/useAbsences";
import { useEmployees } from "@/hooks/useEmployees";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { FiCalendar, FiCheck, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import { formatDate } from "@/lib/utils";

export default function AbsencesPage() {
  const { absences, isLoading, scheduleAbsence, updateAbsence, deleteAbsence } = useAbsences();
  const { employees } = useEmployees({ limit: 100 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("folga");
  const [observations, setObservations] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<any | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState("folga");
  const [editObservations, setEditObservations] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  const employeeOptions = [
    { value: "", label: "Selecione o funcionário" },
    ...employees.map(emp => ({ value: emp.id, label: emp.name }))
  ];

  const typeOptions = [
    { value: "folga", label: "Folga" },
    { value: "falta", label: "Falta" }
  ];

  const statusOptions = [
    { value: "agendada", label: "Agendada" },
    { value: "confirmada", label: "Confirmada" },
    { value: "cancelada", label: "Cancelada" }
  ];

  const handleOpenModal = () => {
    setErrorMsg("");
    setEmployeeId("");
    setDate("");
    setType("folga");
    setObservations("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (abs: any) => {
    setErrorMsg("");
    setEditingAbsence(abs);
    setEditDate(abs.date.split("T")[0]);
    setEditType(abs.type);
    setEditObservations(abs.observations || "");
    setEditStatus(abs.status);
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !date || !type) {
      setErrorMsg("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    try {
      await scheduleAbsence({
        employee_id: employeeId,
        date,
        type,
        observations
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao agendar. Verifique os dados.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAbsence) return;
    if (!editDate || !editType || !editStatus) {
      setErrorMsg("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    try {
      await updateAbsence(editingAbsence.id, {
        date: editDate,
        type: editType,
        status: editStatus,
        observations: editObservations
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao atualizar. Verifique os dados.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta folga/falta?")) return;
    try {
      await deleteAbsence(id);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao excluir folga/falta.");
    }
  };

  const columns = [
    {
      key: "employee_name",
      label: "Colaborador",
      render: (val: string, row: any) => <span className="font-semibold text-gray-900">{val || row.employee_id}</span>
    },
    {
      key: "date",
      label: "Data",
      render: (val: string) => formatDate(val)
    },
    {
      key: "type",
      label: "Tipo",
      render: (val: string) => <Badge status={val} />
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => <Badge status={val} />
    },
    {
      key: "observations",
      label: "Observações",
      render: (val: string) => val || <span className="text-gray-400 italic">Nenhuma</span>
    },
    {
      key: "actions",
      label: "Ações",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          {row.status === "agendada" && (
            <>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 gap-1"
                onClick={() => updateAbsence(row.id, { status: "confirmada" })}
              >
                <FiCheck /> Confirmar
              </Button>
              <Button 
                size="sm" 
                variant="danger" 
                className="gap-1"
                onClick={() => updateAbsence(row.id, { status: "cancelada" })}
              >
                <FiX /> Cancelar
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            className="p-2 border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={() => handleOpenEdit(row)}
            title="Editar"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="p-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={() => handleDelete(row.id)}
            title="Excluir"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Escala de Folgas & Faltas" 
        subtitle="Gerencie e agende as folgas e faltas dos colaboradores"
        action={
          <Button className="gap-2" onClick={handleOpenModal}>
            <FiCalendar /> Agendar Folga / Falta
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={absences} 
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* modal de cadastro */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Folga / Falta">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
              {errorMsg}
            </div>
          )}

          <Select 
            label="Funcionário *"
            options={employeeOptions}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              type="date"
              label="Data *"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select 
              label="Tipo *"
              options={typeOptions}
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] text-gray-900"
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Descreva o motivo ou observações..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD] border border-[#BAE6FD] font-semibold">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* modal de edicao */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Folga / Falta">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Funcionário</label>
            <Input 
              type="text"
              value={editingAbsence?.employee_name || ""}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              type="date"
              label="Data *"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              required
            />
            <Select 
              label="Tipo *"
              options={typeOptions}
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              required
            />
          </div>

          <Select 
            label="Status *"
            options={statusOptions}
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] text-gray-900"
              rows={3}
              value={editObservations}
              onChange={(e) => setEditObservations(e.target.value)}
              placeholder="Descreva o motivo ou observações..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD] border border-[#BAE6FD] font-semibold">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
