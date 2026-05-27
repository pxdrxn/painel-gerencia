"use client";

import { useState } from "react";
import { useAvailability } from "@/hooks/useAvailability";
import { useEmployees } from "@/hooks/useEmployees";
import { useUnits } from "@/hooks/useUnits";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { FiRefreshCw, FiEdit2 } from "react-icons/fi";

// Positions included in the availability system
const AVAILABILITY_POSITIONS = ["atendente", "panfletista", "gerente"];

export default function AvailabilityPage() {
  const { availability, isLoading: isAvailabilityLoading, refetch: refetchAvailability } = useAvailability();
  const { employees, updateEmployee, isLoading: isEmployeesLoading, refetch: refetchEmployees } = useEmployees({ limit: 100 });
  const { units } = useUnits();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<{ id: string; name: string } | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (unitId: string, unitName: string) => {
    setSelectedUnit({ id: unitId, name: unitName });
    const assignedIds = employees
      .filter(
        (emp) =>
          emp.status === "ativo" &&
          AVAILABILITY_POSITIONS.includes(emp.position) &&
          ((emp.available_unit_ids || []).includes(unitId) || emp.unit_id === unitId)
      )
      .map((emp) => emp.id);
    setSelectedEmployeeIds(assignedIds);
    setIsModalOpen(true);
  };

  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSave = async () => {
    if (!selectedUnit) return;
    setIsSaving(true);
    try {
      const targetEmployees = employees.filter(
        (emp) => AVAILABILITY_POSITIONS.includes(emp.position) && emp.status === "ativo"
      );

      for (const emp of targetEmployees) {
        const currentAvailableIds: string[] = emp.available_unit_ids || [];
        const shouldBeAvailable = selectedEmployeeIds.includes(emp.id);
        const isCurrentlyAvailable = currentAvailableIds.includes(selectedUnit.id);

        if (shouldBeAvailable && !isCurrentlyAvailable) {
          await updateEmployee(emp.id, {
            available_unit_ids: [...currentAvailableIds, selectedUnit.id],
          });
        } else if (!shouldBeAvailable && isCurrentlyAvailable) {
          await updateEmployee(emp.id, {
            available_unit_ids: currentAvailableIds.filter((id) => id !== selectedUnit.id),
          });
        }
      }

      await refetchEmployees();
      await refetchAvailability();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving allocations:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Returns an array of names for a given unit and position
  const getUnitStaffNames = (unitId: string, position: string): string[] => {
    return employees
      .filter(
        (emp) =>
          emp.position === position &&
          emp.status === "ativo" &&
          ((emp.available_unit_ids || []).includes(unitId) || emp.unit_id === unitId)
      )
      .map((emp) => emp.name);
  };

  // Renders names in rows of up to 3 chips
  const renderNames = (names: string[], chipColor: string) => {
    if (names.length === 0) return <span className="text-gray-400 text-xs italic">—</span>;

    // Chunk names into groups of 3
    const chunks: string[][] = [];
    for (let i = 0; i < names.length; i += 3) {
      chunks.push(names.slice(i, i + 3));
    }

    return (
      <div className="flex flex-col gap-1">
        {chunks.map((chunk, chunkIdx) => (
          <div key={chunkIdx} className="flex flex-wrap gap-1">
            {chunk.map((name) => (
              <span
                key={name}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${chipColor}`}
              >
                {name}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const tableData = availability.map((avail) => ({
    ...avail,
    attendants_names: getUnitStaffNames(avail.unit_id, "atendente"),
    pamphletists_names: getUnitStaffNames(avail.unit_id, "panfletista"),
    managers_names: getUnitStaffNames(avail.unit_id, "gerente"),
  }));

  const columns = [
    {
      key: "unit_name",
      label: "Unidade",
      render: (val: string) => <span className="font-semibold text-gray-900">{val}</span>,
    },
    {
      key: "attendants_names",
      label: "Atendentes",
      render: (val: string[]) => renderNames(val, "bg-blue-50 text-blue-700"),
    },
    {
      key: "pamphletists_names",
      label: "Panfletistas",
      render: (val: string[]) => renderNames(val, "bg-amber-50 text-amber-700"),
    },
    {
      key: "managers_names",
      label: "Gerentes",
      render: (val: string[]) => renderNames(val, "bg-purple-50 text-purple-700"),
    },
    {
      key: "actions",
      label: "Ações",
      render: (_: any, row: any) => (
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-[#836FFF] border-[#836FFF]/30 hover:bg-[#F3E8FF]"
          onClick={() => handleOpenEdit(row.unit_id, row.unit_name)}
        >
          <FiEdit2 className="w-3.5 h-3.5" /> Editar
        </Button>
      ),
    },
  ];

  // Group employees by position for the modal
  const activeByPosition = (pos: string) =>
    employees.filter((emp) => emp.position === pos && emp.status === "ativo");

  const isLoading = isAvailabilityLoading || isEmployeesLoading;

  const PositionSection = ({
    title,
    position,
    chipColor,
  }: {
    title: string;
    position: string;
    chipColor: string;
  }) => {
    const list = activeByPosition(position);
    return (
      <div>
        <h4 className={`text-sm font-semibold border-b border-gray-100 pb-1 mb-2 ${chipColor}`}>
          {title}
        </h4>
        {list.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhum(a) {title.toLowerCase()} ativo(a) no sistema</p>
        ) : (
          <div className="space-y-1">
            {list.map((emp) => {
              const availableUnits = (emp.available_unit_ids || [])
                .map((uid) => units.find((u) => u.id === uid)?.name)
                .filter(Boolean);
              const mainUnit = units.find((u) => u.id === emp.unit_id)?.name;
              const allUnits = mainUnit
                ? [mainUnit, ...availableUnits.filter((n) => n !== mainUnit)]
                : availableUnits;
              return (
                <label
                  key={emp.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#836FFF] border-gray-300 rounded focus:ring-[#836FFF]"
                    checked={selectedEmployeeIds.includes(emp.id)}
                    onChange={() => handleToggleEmployee(emp.id)}
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{emp.name}</span>
                    {allUnits.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        (Disponível em: {allUnits.join(", ")})
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Disponibilidade de Unidade"
        subtitle="Alocação e mapeamento de atendentes, panfletistas e gerentes por loja"
        action={
          <Button
            onClick={() => {
              refetchAvailability();
              refetchEmployees();
            }}
            variant="outline"
            className="gap-2"
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? "animate-spin" : ""} /> Atualizar
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={tableData} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Alocação de Funcionários — ${selectedUnit?.name}`}
      >
        <div className="space-y-6">
          <p className="text-xs text-gray-500 bg-purple-50 p-2.5 rounded-lg border border-purple-100/50">
            Marque os colaboradores que têm disponibilidade para trabalhar nesta unidade.
            <br />
            <strong>Atenção:</strong> Um colaborador pode ter disponibilidade em múltiplas unidades ao mesmo tempo.
          </p>

          <div className="space-y-5">
            <PositionSection title="Atendentes" position="atendente" chipColor="text-blue-700" />
            <PositionSection title="Panfletistas" position="panfletista" chipColor="text-amber-700" />
            <PositionSection title="Gerentes" position="gerente" chipColor="text-purple-700" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              className="bg-[#F3E8FF] text-[#581C87] hover:bg-[#E9D5FF] border border-[#E9D5FF] font-semibold"
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
