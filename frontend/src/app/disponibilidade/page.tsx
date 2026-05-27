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

export default function AvailabilityPage() {
  const { availability, isLoading: isAvailabilityLoading, refetch: refetchAvailability } = useAvailability();
  const { employees, updateEmployee, isLoading: isEmployeesLoading, refetch: refetchEmployees } = useEmployees({ limit: 100 });
  const { units } = useUnits();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<{ id: string; name: string } | null>(null);
  // We now track which employees are "available" for the selected unit (via available_unit_ids field)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (unitId: string, unitName: string) => {
    setSelectedUnit({ id: unitId, name: unitName });
    // Initialize with employees who have this unit in their available_unit_ids
    const assignedIds = employees
      .filter(
        (emp) =>
          emp.status === "ativo" &&
          (emp.position === "atendente" || emp.position === "panfletista") &&
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
      // Process all active attendants and pamphletists
      const targetEmployees = employees.filter(
        (emp) => (emp.position === "atendente" || emp.position === "panfletista") && emp.status === "ativo"
      );

      for (const emp of targetEmployees) {
        const currentAvailableIds: string[] = emp.available_unit_ids || [];
        const shouldBeAvailable = selectedEmployeeIds.includes(emp.id);
        const isCurrentlyAvailable = currentAvailableIds.includes(selectedUnit.id);

        if (shouldBeAvailable && !isCurrentlyAvailable) {
          // Add this unit to the employee's available_unit_ids
          await updateEmployee(emp.id, {
            available_unit_ids: [...currentAvailableIds, selectedUnit.id],
          });
        } else if (!shouldBeAvailable && isCurrentlyAvailable) {
          // Remove this unit from the employee's available_unit_ids
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

  // Get employees who are available for a given unit (via available_unit_ids or their main unit)
  const getUnitStaffNames = (unitId: string, position: "atendente" | "panfletista") => {
    const list = employees
      .filter(
        (emp) =>
          emp.position === position &&
          emp.status === "ativo" &&
          ((emp.available_unit_ids || []).includes(unitId) || emp.unit_id === unitId)
      )
      .map((emp) => emp.name);
    return list.length > 0 ? list.join(", ") : "-";
  };

  // Build rows for the availability display
  const tableData = availability.map((avail) => ({
    ...avail,
    attendants_list: getUnitStaffNames(avail.unit_id, "atendente"),
    pamphletists_list: getUnitStaffNames(avail.unit_id, "panfletista"),
  }));

  const columns = [
    {
      key: "unit_name",
      label: "Unidade",
      render: (val: string) => <span className="font-semibold text-gray-900">{val}</span>,
    },
    {
      key: "attendants_list",
      label: "Atendentes",
      render: (val: string) => <span className="text-gray-700">{val}</span>,
    },
    {
      key: "pamphletists_list",
      label: "Panfletistas",
      render: (val: string) => <span className="text-gray-700">{val}</span>,
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

  const activeAttendants = employees.filter((emp) => emp.position === "atendente" && emp.status === "ativo");
  const activePamphletists = employees.filter((emp) => emp.position === "panfletista" && emp.status === "ativo");

  const isLoading = isAvailabilityLoading || isEmployeesLoading;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Disponibilidade de Unidade"
        subtitle="Alocação e mapeamento de atendentes e panfletistas por loja"
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

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-1 mb-2">Atendentes</h4>
              {activeAttendants.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhum atendente ativo no sistema</p>
              ) : (
                <div className="space-y-2">
                  {activeAttendants.map((emp) => {
                    const availableUnits = (emp.available_unit_ids || [])
                      .map((uid) => units.find((u) => u.id === uid)?.name)
                      .filter(Boolean);
                    const mainUnit = units.find((u) => u.id === emp.unit_id)?.name;
                    const allUnits = mainUnit ? [mainUnit, ...availableUnits.filter((n) => n !== mainUnit)] : availableUnits;
                    return (
                      <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm">
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

            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-1 mb-2">Panfletistas</h4>
              {activePamphletists.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhum panfletista ativo no sistema</p>
              ) : (
                <div className="space-y-2">
                  {activePamphletists.map((emp) => {
                    const availableUnits = (emp.available_unit_ids || [])
                      .map((uid) => units.find((u) => u.id === uid)?.name)
                      .filter(Boolean);
                    const mainUnit = units.find((u) => u.id === emp.unit_id)?.name;
                    const allUnits = mainUnit ? [mainUnit, ...availableUnits.filter((n) => n !== mainUnit)] : availableUnits;
                    return (
                      <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm">
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
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={isSaving} className="bg-[#F3E8FF] text-[#581C87] hover:bg-[#E9D5FF] border border-[#E9D5FF] font-semibold">
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
