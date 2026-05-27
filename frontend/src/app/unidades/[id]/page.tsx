"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useUnits } from "@/hooks/useUnits";
import { useEmployees } from "@/hooks/useEmployees";
import { api } from "@/lib/api";
import { FiSave, FiX, FiTrash2 } from "react-icons/fi";

export default function UnitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isCreate = params.id === "nova";
  const { createUnit, updateUnit, deleteUnit } = useUnits();
  
  // Busca funcionários ativos para poder selecionar como responsável/gerente
  const { employees, isLoading: loadingEmployees } = useEmployees({ limit: 100, status: "ativo" });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    manager_id: "",
    required_attendants: 0,
    required_pamphletists: 0,
    required_analysts: 0,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(!isCreate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isCreate) {
      const fetchUnitDetails = async () => {
        try {
          // Busca a unidade individual
          const res = await api.get<any>(`/api/units/${params.id}`);
          const data = res.data;
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            manager_id: data.manager_id || "",
            required_attendants: data.required_attendants || 0,
            required_pamphletists: data.required_pamphletists || 0,
            required_analysts: data.required_analysts || 0,
            is_active: data.is_active !== undefined ? data.is_active : true,
          });
        } catch (err: any) {
          console.error(err);
          setSubmitError("Erro ao carregar detalhes da unidade.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchUnitDetails();
    }
  }, [params.id, isCreate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === "number") {
      processedValue = parseInt(value, 10) || 0;
    } else if (name === "is_active") {
      processedValue = value === "true";
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));

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
    if (!formData.name.trim()) tempErrors.name = "Nome da unidade é obrigatório";
    if (formData.required_attendants < 0) tempErrors.required_attendants = "Valor inválido";
    if (formData.required_pamphletists < 0) tempErrors.required_pamphletists = "Valor inválido";
    if (formData.required_analysts < 0) tempErrors.required_analysts = "Valor inválido";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone || null,
        manager_id: formData.manager_id || null,
        required_attendants: formData.required_attendants,
        required_pamphletists: formData.required_pamphletists,
        required_analysts: formData.required_analysts,
        is_active: formData.is_active,
      };

      if (isCreate) {
        await createUnit(payload);
      } else {
        await updateUnit(params.id, payload);
      }
      router.push("/unidades");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Erro ao salvar unidade. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover esta unidade?")) return;
    setIsSubmitting(true);
    try {
      await deleteUnit(params.id);
      router.push("/unidades");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Erro ao excluir unidade.");
      setIsSubmitting(false);
    }
  };

  // Apenas gerentes e supervisores podem ser responsáveis pela unidade
  const managerCandidates = employees.filter(e => e.position === "gerente" || e.position === "supervisor");
  const managerOptions = [
    { value: "", label: "Nenhum (não atribuído)" },
    ...managerCandidates.map(e => ({ value: e.id, label: `${e.name} (${e.position})` }))
  ];

  const statusOptions = [
    { value: "true", label: "Ativa" },
    { value: "false", label: "Inativa / Fechada" },
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
        title={isCreate ? "Nova Unidade" : `Editar Unidade: ${formData.name}`} 
        subtitle={isCreate ? "Cadastre uma nova loja" : "Atualize as informações da unidade"}
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
                label="Nome da Unidade *"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                placeholder="Ex: S.O.S Unidade Leste"
              />

              <Input 
                name="phone"
                label="Telefone / Contato"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ex: (11) 3333-0006"
              />

              <Select 
                name="manager_id"
                label="Gerente Responsável"
                options={managerOptions}
                value={formData.manager_id || ""}
                onChange={handleInputChange}
                disabled={loadingEmployees}
              />

              <Select 
                name="is_active"
                label="Status da Loja"
                options={statusOptions}
                value={formData.is_active ? "true" : "false"}
                onChange={handleInputChange}
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">
                Necessidade Operacional de Equipe (Metas de Staff)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input 
                  name="required_attendants"
                  label="Qtd. Atendentes Requeridos"
                  type="number"
                  min="0"
                  value={formData.required_attendants}
                  onChange={handleInputChange}
                  error={errors.required_attendants}
                />

                <Input 
                  name="required_pamphletists"
                  label="Qtd. Panfletistas Requeridos"
                  type="number"
                  min="0"
                  value={formData.required_pamphletists}
                  onChange={handleInputChange}
                  error={errors.required_pamphletists}
                />

                <Input 
                  name="required_analysts"
                  label="Qtd. Analistas Requeridos"
                  type="number"
                  min="0"
                  value={formData.required_analysts}
                  onChange={handleInputChange}
                  error={errors.required_analysts}
                />
              </div>
            </div>

            <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
              <div>
                {!isCreate && (
                  <Button 
                    type="button" 
                    variant="danger" 
                    onClick={handleDelete}
                    className="gap-2"
                    disabled={isSubmitting}
                  >
                    <FiTrash2 /> Excluir Unidade
                  </Button>
                )}
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/unidades")}
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
                  <FiSave /> Salvar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
