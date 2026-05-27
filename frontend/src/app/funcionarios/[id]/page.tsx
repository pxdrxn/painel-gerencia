"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useEmployees } from "@/hooks/useEmployees";
import { useUnits } from "@/hooks/useUnits";
import { api } from "@/lib/api";
import { FiSave, FiX, FiTrash2 } from "react-icons/fi";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { updateEmployee, deleteEmployee } = useEmployees();
  const { units, isLoading: loadingUnits } = useUnits();

  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    phone: "",
    email: "",
    position: "atendente",
    unit_id: "",
    hire_date: "",
    status: "ativo",
    observations: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const res = await api.get<any>(`/api/employees/${params.id}`);
        const data = res.data;
        setFormData({
          name: data.name || "",
          cpf: data.cpf || "",
          phone: data.phone || "",
          email: data.email || "",
          position: data.position || "atendente",
          unit_id: data.unit_id || "",
          hire_date: data.hire_date || "",
          status: data.status || "ativo",
          observations: data.observations || "",
        });
      } catch (err: any) {
        console.error(err);
        setSubmitError("Erro ao carregar detalhes do funcionário.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployeeDetails();
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.name.trim()) tempErrors.name = "Nome é obrigatório";
    if (!formData.unit_id) tempErrors.unit_id = "Selecione uma unidade";
    if (!formData.position) tempErrors.position = "Selecione um cargo";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await updateEmployee(params.id, {
        name: formData.name,
        phone: formData.phone || null,
        position: formData.position,
        unit_id: formData.unit_id,
        status: formData.status,
        observations: formData.observations || null,
      });
      router.push("/funcionarios");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Erro ao salvar funcionário. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja desativar este funcionário?")) return;
    setIsSubmitting(true);
    try {
      await deleteEmployee(params.id);
      router.push("/funcionarios");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Erro ao desativar funcionário.");
      setIsSubmitting(false);
    }
  };

  const unitOptions = [
    { value: "", label: "Selecione uma unidade..." },
    ...units.map(u => ({ value: u.id, label: u.name }))
  ];

  const positionOptions = [
    { value: "atendente", label: "Atendente" },
    { value: "panfletista", label: "Panfletista" },
    { value: "analista", label: "Analista" },
    { value: "gerente", label: "Gerente" },
    { value: "supervisor", label: "Supervisor" },
  ];

  const statusOptions = [
    { value: "ativo", label: "Ativo" },
    { value: "ferias", label: "Férias" },
    { value: "afastado", label: "Afastado" },
    { value: "inativo", label: "Inativo" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#836FFF]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title={`Editar Funcionário: ${formData.name}`} 
        subtitle="Gerencie os dados cadastrais e operacionais"
      />

      <Card className="shadow-lg border-gray-100">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                name="name"
                label="Nome Completo *"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
              />

              <Input 
                name="phone"
                label="Telefone / WhatsApp"
                value={formData.phone}
                onChange={handleInputChange}
              />

              <Select 
                name="position"
                label="Cargo *"
                options={positionOptions}
                value={formData.position}
                onChange={handleInputChange}
                error={errors.position}
              />

              <Select 
                name="unit_id"
                label="Unidade *"
                options={unitOptions}
                value={formData.unit_id}
                onChange={handleInputChange}
                error={errors.unit_id}
                disabled={loadingUnits}
              />

              <Input 
                name="hire_date"
                label="Data de Contratação (Não alterável)"
                type="date"
                value={formData.hire_date}
                disabled
              />

              <Select 
                name="status"
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="observations" className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                id="observations"
                name="observations"
                rows={3}
                className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 focus:border-[#836FFF] focus:ring-1 focus:ring-[#836FFF] focus:outline-none transition-colors"
                value={formData.observations}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDelete}
                className="gap-2"
                disabled={isSubmitting}
              >
                <FiTrash2 /> Desativar Funcionário
              </Button>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/funcionarios")}
                  className="gap-2"
                  disabled={isSubmitting}
                >
                  <FiX /> Cancelar
                </Button>
                
                <Button 
                  type="submit" 
                  className="gap-2"
                  loading={isSubmitting}
                >
                  <FiSave /> Salvar Alterações
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
