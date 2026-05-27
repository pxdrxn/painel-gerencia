"use client";

import { useState } from "react";
import { useVacations } from "@/hooks/useVacations";
import { useEmployees } from "@/hooks/useEmployees";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";
import { formatDate } from "@/lib/utils";

export default function VacationsPage() {
  const { vacations, isLoading, scheduleVacation, updateVacation, completeVacation, deleteVacation } = useVacations();
  const { employees } = useEmployees({ limit: 100 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [observations, setObservations] = useState("");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<any | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editObservations, setEditObservations] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  const employeeOptions = [
    { value: "", label: "Selecione o funcionário" },
    ...employees.map(emp => ({ value: emp.id, label: emp.name }))
  ];

  const statusOptions = [
    { value: "agendada", label: "Agendada" },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "concluida", label: "Concluída" },
    { value: "cancelada", label: "Cancelada" }
  ];

  const handleOpenModal = () => {
    setErrorMsg("");
    setEmployeeId("");
    setStartDate("");
    setEndDate("");
    setObservations("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vac: any) => {
    setErrorMsg("");
    setEditingVacation(vac);
    setEditStartDate(vac.start_date.split("T")[0]);
    setEditEndDate(vac.end_date.split("T")[0]);
    setEditObservations(vac.observations || "");
    setEditStatus(vac.status);
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate) {
      setErrorMsg("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }
    
    try {
      await scheduleVacation({
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
        observations
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Erro ao agendar férias. Verifique se há conflito de datas.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVacation) return;
    if (!editStartDate || !editEndDate || !editStatus) {
      setErrorMsg("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    try {
      await updateVacation(editingVacation.id, {
        start_date: editStartDate,
        end_date: editEndDate,
        observations: editObservations,
        status: editStatus
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Erro ao atualizar férias. Verifique se há conflito de datas.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento de férias?")) return;
    try {
      await deleteVacation(id);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao excluir férias.");
    }
  };

  const columns = [
    { key: "employee_name", label: "Colaborador", render: (val: string, row: any) => <span className="font-medium text-gray-900">{val || row.employee_id}</span> },
    { key: "start_date", label: "Período Saída", render: (val: string) => formatDate(val) },
    { key: "end_date", label: "Retorno", render: (val: string) => formatDate(val) },
    { key: "observations", label: "Observações", render: (val: string) => <span className="text-gray-600 text-sm max-w-[200px] truncate block" title={val}>{val || "—"}</span> },
    { key: "status", label: "Status", render: (val: string) => <Badge status={val} /> },
    {
      key: "actions",
      label: "Ações",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          {(row.status === "agendada" || row.status === "em_andamento") && (
            <>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white focus:ring-green-500" 
                onClick={() => completeVacation(row.id)}
              >
                Concluir
              </Button>
              <Button 
                size="sm" 
                variant="danger" 
                onClick={() => updateVacation(row.id, { status: "cancelada" })}
              >
                Cancelar
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
        title="Calendário de Férias" 
        subtitle="Acompanhe as férias e licenças dos colaboradores"
        action={
          <Button className="gap-2" onClick={handleOpenModal}>
            <FiCalendar /> Agendar Férias
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={vacations} 
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* modal de cadastro */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Férias">
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
              label="Data de Início *"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input 
              type="date"
              label="Data de Fim *"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#836FFF] focus:ring-1 focus:ring-[#836FFF] text-gray-900"
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Alguma observação opcional..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#F3E8FF] text-[#581C87] hover:bg-[#E9D5FF] border border-[#E9D5FF] font-semibold">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      {/* modal de edicao */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Férias">
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
              value={editingVacation?.employee_name || ""}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              type="date"
              label="Data de Início *"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
              required
            />
            <Input 
              type="date"
              label="Data de Fim *"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
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
              className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#836FFF] focus:ring-1 focus:ring-[#836FFF] text-gray-900"
              rows={3}
              value={editObservations}
              onChange={(e) => setEditObservations(e.target.value)}
              placeholder="Alguma observação opcional..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#F3E8FF] text-[#581C87] hover:bg-[#E9D5FF] border border-[#E9D5FF] font-semibold">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
