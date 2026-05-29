"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useEmployees } from "@/hooks/useEmployees";
import { useUnits } from "@/hooks/useUnits";
import { FiSave, FiX } from "react-icons/fi";

export default function NewEmployeePage() {
  const router = useRouter();
  const { createEmployee } = useEmployees();
  const { units, isLoading: loadingUnits } = useUnits();

  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    cnpj: "",
    phone: "",
    email: "",
    position: "atendente",
    unit_id: "",
    start_date: "",
    hire_date: new Date().toISOString().split("T")[0],
    status: "ativo",
    observations: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const formatCPFInput = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "");
    
    // Aplica a máscara 000.000.000-00
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const formatCNPJInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "cpf") {
      setFormData(prev => ({ ...prev, cpf: formatCPFInput(value) }));
    } else if (name === "cnpj") {
      setFormData(prev => ({ ...prev, cnpj: formatCNPJInput(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

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
    if (!formData.position) tempErrors.position = "Selecione um cargo";
    if (!formData.hire_date) tempErrors.hire_date = "Data de contratação é obrigatória";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await createEmployee({
        name: formData.name,
        cpf: null,
        cnpj: formData.cnpj || null,
        phone: formData.phone || null,
        email: null,
        position: formData.position,
        unit_id: null,
        start_date: formData.start_date || null,
        hire_date: formData.hire_date,
        status: formData.status,
        observations: formData.observations || null,
      });
      router.push("/funcionarios");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Erro ao cadastrar funcionário. Verifique os dados.");
    } finally {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Novo Funcionário" 
        subtitle="Cadastre um novo colaborador no sistema da S.O.S Crédito"
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
                placeholder="Ex: João da Silva"
              />

              <Input 
                name="phone"
                label="Telefone / WhatsApp"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
              />

              <Input 
                name="cnpj"
                label="CNPJ"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
              />

              <Select 
                name="position"
                label="Cargo *"
                options={positionOptions}
                value={formData.position}
                onChange={handleInputChange}
                error={errors.position}
              />

              <Input 
                name="start_date"
                label="Data de Início (Sem Contrato)"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
              />

              <Input 
                name="hire_date"
                label="Data de Contratação *"
                type="date"
                value={formData.hire_date}
                onChange={handleInputChange}
                error={errors.hire_date}
              />

              <Select 
                name="status"
                label="Status Inicial"
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
                placeholder="Alguma observação relevante sobre o colaborador..."
                value={formData.observations}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
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
                <FiSave /> Salvar Funcionário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
