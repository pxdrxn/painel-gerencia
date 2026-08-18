"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useDailyRates, DailyRateRecord, DayBreakdownItem, DailyRatePreviewResponse } from "@/hooks/useDailyRates";
import { useEmployees } from "@/hooks/useEmployees";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { 
  FiDollarSign, 
  FiCalendar, 
  FiPrinter, 
  FiSave, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiEdit2, 
  FiTrash2, 
  FiFileText, 
  FiEye, 
  FiRefreshCw,
  FiCheck,
  FiX,
  FiLayers
} from "react-icons/fi";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

// Helper dates
const getPresetDates = (preset: "current_month" | "last_month" | "last_15" | "current_week") => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (preset === "current_month") {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      start: firstDay.toISOString().split("T")[0],
      end: lastDay.toISOString().split("T")[0],
    };
  }

  if (preset === "last_month") {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    return {
      start: firstDay.toISOString().split("T")[0],
      end: lastDay.toISOString().split("T")[0],
    };
  }

  if (preset === "last_15") {
    const past = new Date(now);
    past.setDate(now.getDate() - 14);
    return {
      start: past.toISOString().split("T")[0],
      end: now.toISOString().split("T")[0],
    };
  }

  if (preset === "current_week") {
    const curr = new Date(now);
    const day = curr.getDay(); // 0 is sunday
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    return {
      start: monday.toISOString().split("T")[0],
      end: saturday.toISOString().split("T")[0],
    };
  }

  return { start: "", end: "" };
};

export default function DailyRatesPage() {
  const { employees, isLoading: loadingEmployees } = useEmployees({ limit: 100 });
  const { 
    dailyRates, 
    isLoading: loadingDailyRates, 
    calculatePreview, 
    createDailyRate, 
    updateDailyRate, 
    deleteDailyRate, 
    refetch 
  } = useDailyRates();

  // Mode: "calculator" | "history"
  const [activeTab, setActiveTab] = useState<"calculator" | "history">("calculator");

  // Calculator Form State
  const initialDates = getPresetDates("current_month");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [dailyValue, setDailyValue] = useState("80.00");
  const [ruleType, setRuleType] = useState("seg_sab"); // seg_sex | seg_sab | todos
  const [discountAbsences, setDiscountAbsences] = useState(true);
  const [discountVacations, setDiscountVacations] = useState(true);
  const [additionsValue, setAdditionsValue] = useState("0");
  const [discountsValue, setDiscountsValue] = useState("0");
  const [notes, setNotes] = useState("");
  const [customOverrides, setCustomOverrides] = useState<Record<string, number>>({});

  // Calculation state
  const [previewResult, setPreviewResult] = useState<DailyRatePreviewResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calcError, setCalcError] = useState("");

  // Modals
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyRateRecord | null>(null);
  const [editStatus, setEditStatus] = useState("pendente");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // History filters
  const [historyEmployeeFilter, setHistoryEmployeeFilter] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  // Selected employee obj
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  // Run calculation
  const handleCalculate = async () => {
    if (!selectedEmployeeId) {
      setCalcError("Selecione um funcionário.");
      return;
    }
    if (!startDate || !endDate) {
      setCalcError("Informe as datas de início e fim.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setCalcError("A data de término não pode ser anterior à data de início.");
      return;
    }

    setCalcError("");
    setIsCalculating(true);

    try {
      const parsedDailyVal = parseFloat(dailyValue.replace(",", ".")) || 0;
      const parsedAddVal = parseFloat(additionsValue.replace(",", ".")) || 0;
      const parsedDiscVal = parseFloat(discountsValue.replace(",", ".")) || 0;

      const res = await calculatePreview({
        employee_id: selectedEmployeeId,
        start_date: startDate,
        end_date: endDate,
        daily_value: parsedDailyVal,
        rule_type: ruleType,
        discount_absences: discountAbsences,
        discount_vacations: discountVacations,
        additions_value: parsedAddVal,
        discounts_value: parsedDiscVal,
        custom_overrides: customOverrides,
      });

      setPreviewResult(res);
    } catch (err: any) {
      console.error(err);
      setCalcError(err.response?.data?.message || err.message || "Erro ao calcular diárias.");
    } finally {
      setIsCalculating(false);
    }
  };

  // Trigger calculate when main params change (if employee is selected)
  useEffect(() => {
    if (selectedEmployeeId && startDate && endDate) {
      handleCalculate();
    }
  }, [
    selectedEmployeeId, 
    startDate, 
    endDate, 
    dailyValue, 
    ruleType, 
    discountAbsences, 
    discountVacations, 
    additionsValue, 
    discountsValue,
    customOverrides
  ]);

  // Reset custom overrides when employee or period changes
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    setCustomOverrides({});
  };

  const handlePeriodChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCustomOverrides({});
  };

  // Toggle factor for a specific day in breakdown
  const handleToggleDayFactor = (dateStr: string, currentFactor: number) => {
    let nextFactor = 1.0;
    if (currentFactor === 1.0) nextFactor = 0.5;
    else if (currentFactor === 0.5) nextFactor = 0.0;
    else nextFactor = 1.0;

    setCustomOverrides((prev) => ({
      ...prev,
      [dateStr]: nextFactor,
    }));
  };

  // Save calculation to history
  const handleSaveCalculation = async () => {
    if (!previewResult) return;
    setIsSaving(true);
    setCalcError("");

    try {
      await createDailyRate({
        employee_id: previewResult.employee_id,
        start_date: previewResult.start_date,
        end_date: previewResult.end_date,
        daily_value: previewResult.daily_value,
        days_count: previewResult.effective_days_count,
        total_value: previewResult.total_value,
        rule_type: ruleType,
        work_saturdays: ruleType !== "seg_sex",
        discount_absences: discountAbsences,
        discount_vacations: discountVacations,
        absences_deducted: previewResult.absences_deducted,
        vacations_deducted: previewResult.vacations_deducted,
        saturday_half_days: previewResult.saturday_half_days,
        additions_value: previewResult.additions_value,
        discounts_value: previewResult.discounts_value,
        status: "pendente",
        notes: notes || null,
        details_breakdown: previewResult.breakdown,
      });

      alert("Lançamento de diárias salvo com sucesso no Histórico!");
      setActiveTab("history");
    } catch (err: any) {
      console.error(err);
      setCalcError(err.response?.data?.message || err.message || "Erro ao salvar diárias.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open receipt modal from preview
  const handleOpenReceiptFromPreview = () => {
    if (!previewResult) return;
    setReceiptData({
      employee_name: previewResult.employee_name,
      employee_position: previewResult.employee_position,
      employee_cpf: previewResult.employee_cpf,
      employee_cnpj: previewResult.employee_cnpj,
      unit_name: previewResult.unit_name,
      start_date: previewResult.start_date,
      end_date: previewResult.end_date,
      total_calendar_days: previewResult.total_calendar_days,
      effective_days_count: previewResult.effective_days_count,
      daily_value: previewResult.daily_value,
      subtotal_value: previewResult.subtotal_value,
      additions_value: previewResult.additions_value,
      discounts_value: previewResult.discounts_value,
      total_value: previewResult.total_value,
      absences_deducted: previewResult.absences_deducted,
      vacations_deducted: previewResult.vacations_deducted,
      saturday_half_days: previewResult.saturday_half_days,
      notes: notes,
      status: "pendente",
      created_at: new Date().toISOString(),
    });
    setIsReceiptModalOpen(true);
  };

  // Open receipt modal from history record
  const handleOpenReceiptFromRecord = (record: DailyRateRecord) => {
    setReceiptData({
      employee_name: record.employee_name,
      employee_position: record.employee_position,
      employee_cpf: record.employee_cpf,
      employee_cnpj: record.employee_cnpj,
      unit_name: record.unit_name,
      start_date: record.start_date,
      end_date: record.end_date,
      total_calendar_days: Math.round((new Date(record.end_date).getTime() - new Date(record.start_date).getTime()) / (1000 * 3600 * 24)) + 1,
      effective_days_count: record.days_count,
      daily_value: record.daily_value,
      subtotal_value: record.days_count * record.daily_value,
      additions_value: record.additions_value,
      discounts_value: record.discounts_value,
      total_value: record.total_value,
      absences_deducted: record.absences_deducted,
      vacations_deducted: record.vacations_deducted,
      saturday_half_days: record.saturday_half_days,
      notes: record.notes,
      status: record.status,
      payment_date: record.payment_date,
      created_at: record.created_at,
    });
    setIsReceiptModalOpen(true);
  };

  // Handle Edit Record Modal
  const handleOpenEdit = (rec: DailyRateRecord) => {
    setEditingRecord(rec);
    setEditStatus(rec.status);
    setEditPaymentDate(rec.payment_date ? rec.payment_date.split("T")[0] : "");
    setEditNotes(rec.notes || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      await updateDailyRate(editingRecord.id, {
        status: editStatus,
        payment_date: editPaymentDate || null,
        notes: editNotes || null,
      });
      setIsEditModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar status da diária.");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro de diárias do histórico?")) {
      try {
        await deleteDailyRate(id);
      } catch (e) {
        console.error(e);
        alert("Erro ao excluir registro.");
      }
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Filtered history
  const filteredDailyRates = useMemo(() => {
    return dailyRates.filter((r) => {
      if (historyEmployeeFilter && r.employee_id !== historyEmployeeFilter) return false;
      if (historyStatusFilter && r.status !== historyStatusFilter) return false;
      return true;
    });
  }, [dailyRates, historyEmployeeFilter, historyStatusFilter]);

  // History columns
  const historyColumns = [
    {
      key: "employee_name",
      label: "Colaborador",
      render: (val: string, row: DailyRateRecord) => (
        <div>
          <span className="font-bold text-gray-900 block">{val || "Colaborador"}</span>
          <span className="text-xs text-gray-500 font-medium">
            {row.employee_position ? `${row.employee_position.toUpperCase()}` : ""}
            {row.unit_name ? ` • ${row.unit_name}` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "period",
      label: "Período",
      render: (_: any, row: DailyRateRecord) => (
        <span className="font-semibold text-gray-800 text-sm">
          {formatDate(row.start_date)} até {formatDate(row.end_date)}
        </span>
      ),
    },
    {
      key: "days_count",
      label: "Diárias",
      render: (val: number) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-blue-50 text-[#1B365D] border border-blue-100">
          {val} {val === 1 ? "dia" : "dias"}
        </span>
      ),
    },
    {
      key: "daily_value",
      label: "Valor Diária",
      render: (val: number) => <span className="text-gray-700 font-medium">{formatCurrency(val)}</span>,
    },
    {
      key: "total_value",
      label: "Total a Pagar",
      render: (val: number) => (
        <span className="font-extrabold text-[#1B365D] text-sm">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
          pendente: { bg: "bg-yellow-50 border-yellow-200 text-yellow-800", text: "text-yellow-700", label: "Pendente" },
          aprovado: { bg: "bg-blue-50 border-blue-200 text-blue-800", text: "text-blue-700", label: "Aprovado" },
          pago: { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", text: "text-emerald-700", label: "Pago" },
          cancelado: { bg: "bg-gray-50 border-gray-200 text-gray-600", text: "text-gray-600", label: "Cancelado" },
        };
        const st = map[val] || map.pendente;
        return (
          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider", st.bg)}>
            {st.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Ações",
      render: (_: any, row: DailyRateRecord) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="p-1.5 text-[#1B365D] border-blue-200 hover:bg-blue-50"
            onClick={() => handleOpenReceiptFromRecord(row)}
            title="Ver / Imprimir Recibo"
          >
            <FiPrinter className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="p-1.5 text-gray-600 border-gray-200 hover:bg-gray-100"
            onClick={() => handleOpenEdit(row)}
            title="Alterar Status / Detalhes"
          >
            <FiEdit2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="p-1.5 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeleteRecord(row.id)}
            title="Excluir do Histórico"
          >
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Controle & Contagem de Diárias"
        subtitle="Calcule com precisão as diárias trabalhadas de colaboradores por período de início e fim"
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("calculator")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
            activeTab === "calculator"
              ? "bg-[#1B365D] text-white shadow-md shadow-[#1B365D]/20"
              : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
          )}
        >
          <FiCalendar className="w-4 h-4" />
          <span>Calculadora de Diárias</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
            activeTab === "history"
              ? "bg-[#1B365D] text-white shadow-md shadow-[#1B365D]/20"
              : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
          )}
        >
          <FiFileText className="w-4 h-4" />
          <span>Histórico de Lançamentos</span>
          {dailyRates.length > 0 && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold",
              activeTab === "history" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
            )}>
              {dailyRates.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "calculator" && (
        <div className="space-y-6">
          {/* Main Calculation Form Card */}
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#1B365D]/5 border-b border-[#1B365D]/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1B365D] text-white flex items-center justify-center font-black">
                  <FiDollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#1B365D]">Parâmetros de Contagem de Diárias</h2>
                  <p className="text-xs text-gray-500">Defina o colaborador e o intervalo de datas para calcular</p>
                </div>
              </div>

              {/* Quick Period Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-gray-500 mr-1">Atalhos:</span>
                <button
                  type="button"
                  onClick={() => {
                    const p = getPresetDates("current_month");
                    handlePeriodChange(p.start, p.end);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Mês Atual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = getPresetDates("last_month");
                    handlePeriodChange(p.start, p.end);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Mês Anterior
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = getPresetDates("last_15");
                    handlePeriodChange(p.start, p.end);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Últimos 15 Dias
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = getPresetDates("current_week");
                    handlePeriodChange(p.start, p.end);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Esta Semana
                </button>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {calcError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                  <span>{calcError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Employee Select */}
                <div className="md:col-span-1 space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Colaborador *
                  </label>
                  <Select
                    options={[
                      { value: "", label: "Selecione o colaborador..." },
                      ...employees.map((emp) => ({
                        value: emp.id,
                        label: `${emp.name} (${emp.position.toUpperCase()})${emp.unit_name ? ` - ${emp.unit_name}` : ""}`,
                      })),
                    ]}
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    disabled={loadingEmployees}
                    required
                  />
                  {selectedEmployee && (
                    <div className="text-[11px] text-gray-500 font-medium mt-1 flex items-center gap-2">
                      <span>Status: <strong className="text-gray-700 capitalize">{selectedEmployee.status}</strong></span>
                      {selectedEmployee.cnpj && (
                        <span>• CNPJ: <strong className="text-gray-700">{selectedEmployee.cnpj}</strong></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    className="block w-full rounded-lg border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] text-gray-900 font-semibold"
                    value={startDate}
                    onChange={(e) => handlePeriodChange(e.target.value, endDate)}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Data de Fim *
                  </label>
                  <input
                    type="date"
                    className="block w-full rounded-lg border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] text-gray-900 font-semibold"
                    value={endDate}
                    onChange={(e) => handlePeriodChange(startDate, e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                {/* Daily Rate Value */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Valor da Diária (R$) *
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold sm:text-sm">R$</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-9 font-black text-gray-900"
                      value={dailyValue}
                      onChange={(e) => setDailyValue(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Work Regime Rule */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Regime de Trabalho *
                  </label>
                  <Select
                    options={[
                      { value: "seg_sab", label: "Segunda a Sábado (6 dias/sem)" },
                      { value: "seg_sex", label: "Segunda a Sexta (5 dias/sem)" },
                      { value: "todos", label: "Todos os dias corridos (7 dias/sem)" },
                    ]}
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value)}
                  />
                </div>

                {/* Additions & Discounts */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Adicional (+)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={additionsValue}
                      onChange={(e) => setAdditionsValue(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Desconto (-)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountsValue}
                      onChange={(e) => setDiscountsValue(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Deduction Checkboxes */}
              <div className="flex flex-wrap items-center gap-6 p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs font-semibold text-gray-700">
                <span className="font-bold text-gray-900 uppercase">Cruzamento Automático:</span>
                
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[#1B365D] focus:ring-[#1B365D] border-gray-300"
                    checked={discountAbsences}
                    onChange={(e) => setDiscountAbsences(e.target.checked)}
                  />
                  <span>Descontar Faltas/Folgas Registradas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[#1B365D] focus:ring-[#1B365D] border-gray-300"
                    checked={discountVacations}
                    onChange={(e) => setDiscountVacations(e.target.checked)}
                  />
                  <span>Descontar Período de Férias</span>
                </label>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Observações do Lançamento
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] text-gray-900"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pagamento referente à primeira quinzena, bônus de produção incluso..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Summary & KPI Cards */}
          {previewResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Calendar Days */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-gray-800">
                    {previewResult.total_calendar_days}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                    Dias no Período
                  </span>
                </div>

                {/* Deductions */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-amber-600">
                    {previewResult.absences_deducted + previewResult.vacations_deducted + (previewResult.saturday_half_days * 0.5)}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                    Deduções (Faltas/Férias)
                  </span>
                </div>

                {/* Effective Days Count */}
                <div className="bg-gradient-to-br from-[#1B365D] to-[#244577] text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {previewResult.effective_days_count}
                  </span>
                  <span className="text-[11px] font-extrabold text-blue-100 uppercase tracking-widest mt-1">
                    Diárias Efetivas
                  </span>
                </div>

                {/* Daily Rate Value */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-gray-800">
                    {formatCurrency(previewResult.daily_value)}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                    Valor da Diária
                  </span>
                </div>

                {/* Total Value */}
                <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {formatCurrency(previewResult.total_value)}
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-100 uppercase tracking-widest mt-1">
                    Total a Pagar Líquido
                  </span>
                </div>
              </div>

              {/* Day by Day Breakdown Calendar Table */}
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-white px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <FiLayers className="w-4 h-4 text-[#1B365D]" />
                      Detalhamento do Período — Dia a Dia
                    </h3>
                    <p className="text-xs text-gray-500">
                      Você pode clicar no valor da diária para alternar manualmente entre 1.0, 0.5 ou 0.0 diária
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {Object.keys(customOverrides).length > 0 && (
                      <button
                        onClick={() => setCustomOverrides({})}
                        className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                      >
                        Resetar Ajustes Manuais
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Dia da Semana</th>
                        <th className="py-3 px-4">Ocorrência / Situação</th>
                        <th className="py-3 px-4">Diária Atribuída</th>
                        <th className="py-3 px-4 text-right">Ação / Ajuste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {previewResult.breakdown.map((item) => {
                        const dateFormatted = formatDate(item.date);
                        const isSunday = item.day_of_week === 6;
                        const isSaturday = item.day_of_week === 5;
                        const isOverridden = item.date in customOverrides;

                        return (
                          <tr
                            key={item.date}
                            className={cn(
                              "hover:bg-gray-50/80 transition-colors",
                              isSunday ? "bg-gray-50/50 text-gray-400" : "",
                              item.occurrence === "ferias" ? "bg-purple-50/40" : "",
                              item.occurrence === "falta" ? "bg-red-50/40" : "",
                              item.occurrence === "folga" ? "bg-blue-50/30" : ""
                            )}
                          >
                            <td className="py-2.5 px-4 font-bold text-gray-900">
                              {dateFormatted}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold",
                                isSunday ? "bg-gray-200 text-gray-600" : isSaturday ? "bg-sky-100 text-[#0369A1]" : "bg-blue-50 text-[#1B365D]"
                              )}>
                                {item.day_name}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                {item.occurrence === "normal" && (
                                  <span className="text-xs text-gray-700 font-medium">Dia Normal Trabalhado</span>
                                )}
                                {item.occurrence === "sabado_escala" && (
                                  <span className="text-xs text-sky-800 font-bold">Sábado Trabalhado (Integral)</span>
                                )}
                                {item.occurrence === "sabado_meiodia" && (
                                  <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Sábado Meio-Dia (Largou 12h)
                                  </span>
                                )}
                                {item.occurrence === "sabado_folga" && (
                                  <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                                    Sábado Folga
                                  </span>
                                )}
                                {item.occurrence === "domingo" && (
                                  <span className="text-xs text-gray-400">Domingo</span>
                                )}
                                {item.occurrence === "ferias" && (
                                  <span className="text-xs text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded">
                                    Em Férias
                                  </span>
                                )}
                                {item.occurrence === "falta" && (
                                  <span className="text-xs text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">
                                    Falta Registrada
                                  </span>
                                )}
                                {item.occurrence === "folga" && (
                                  <span className="text-xs text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                                    Folga Registrada
                                  </span>
                                )}
                                {item.notes && item.occurrence === "normal" && (
                                  <span className="text-xs text-gray-400 italic">({item.notes})</span>
                                )}
                                {isOverridden && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                                    Manual
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black",
                                item.rate_factor === 1.0 ? "bg-green-100 text-green-800" :
                                item.rate_factor === 0.5 ? "bg-amber-100 text-amber-800" :
                                "bg-gray-100 text-gray-500"
                              )}>
                                {item.rate_factor.toFixed(1)} diária
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleDayFactor(item.date, item.rate_factor)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                title="Alternar fator deste dia (1.0 -> 0.5 -> 0.0)"
                              >
                                Alternar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold"
                  onClick={handleOpenReceiptFromPreview}
                >
                  <FiPrinter className="w-4 h-4" />
                  Gerar / Imprimir Recibo
                </Button>

                <Button
                  type="button"
                  className="w-full sm:w-auto gap-2 bg-[#1B365D] hover:bg-[#244577] text-white font-bold shadow-md shadow-[#1B365D]/20"
                  onClick={handleSaveCalculation}
                  loading={isSaving}
                >
                  <FiSave className="w-4 h-4" />
                  Salvar Lançamento no Histórico
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* History Filters */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-64">
                  <Select
                    options={[
                      { value: "", label: "Todos os Colaboradores" },
                      ...employees.map((e) => ({ value: e.id, label: e.name })),
                    ]}
                    value={historyEmployeeFilter}
                    onChange={(e) => setHistoryEmployeeFilter(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-44">
                  <Select
                    options={[
                      { value: "", label: "Todos os Status" },
                      { value: "pendente", label: "Pendente" },
                      { value: "aprovado", label: "Aprovado" },
                      { value: "pago", label: "Pago" },
                      { value: "cancelado", label: "Cancelado" },
                    ]}
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  className="gap-1.5 text-gray-700"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" /> Atualizar
                </Button>
              </div>
            </div>

            <DataTable
              columns={historyColumns}
              data={filteredDailyRates}
              isLoading={loadingDailyRates}
            />
          </CardContent>
        </Card>
      )}

      {/* RECEIPT / PRINT MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Recibo de Pagamento de Diárias"
      >
        {receiptData && (
          <div className="space-y-6">
            {/* Printable Receipt Layout */}
            <div ref={printRef} className="p-6 bg-white border border-gray-200 rounded-xl space-y-6 text-gray-900 print:border-none print:p-0">
              {/* Header */}
              <div className="border-b-2 border-gray-900 pb-4 text-center">
                <h2 className="text-xl font-black tracking-tight uppercase text-gray-900">S.O.S CRÉDITO</h2>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Comprovante & Recibo de Diárias Trabalhadas
                </p>
              </div>

              {/* Colaborador & Period info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-500 font-bold uppercase block">Colaborador</span>
                  <span className="font-extrabold text-gray-900 text-sm block">{receiptData.employee_name}</span>
                  {receiptData.employee_cpf && (
                    <span className="text-gray-600 font-medium block">CPF: {receiptData.employee_cpf}</span>
                  )}
                  {receiptData.employee_cnpj && (
                    <span className="text-gray-600 font-medium block">CNPJ: {receiptData.employee_cnpj}</span>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-gray-500 font-bold uppercase block">Período de Apuração</span>
                  <span className="font-extrabold text-gray-900 text-sm block">
                    {formatDate(receiptData.start_date)} até {formatDate(receiptData.end_date)}
                  </span>
                  <span className="text-gray-600 font-medium block">
                    Cargo: {receiptData.employee_position ? receiptData.employee_position.toUpperCase() : "—"}
                  </span>
                  {receiptData.unit_name && (
                    <span className="text-gray-600 font-medium block">Unidade: {receiptData.unit_name}</span>
                  )}
                </div>
              </div>

              {/* Details table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Descrição</th>
                      <th className="p-2.5 text-center">Qtd / Base</th>
                      <th className="p-2.5 text-right">Valor Unitário</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    <tr>
                      <td className="p-2.5">Diárias Efetivas Trabalhadas</td>
                      <td className="p-2.5 text-center font-bold">{receiptData.effective_days_count} dias</td>
                      <td className="p-2.5 text-right">{formatCurrency(receiptData.daily_value)}</td>
                      <td className="p-2.5 text-right font-bold">{formatCurrency(receiptData.subtotal_value)}</td>
                    </tr>
                    {receiptData.additions_value > 0 && (
                      <tr>
                        <td className="p-2.5 text-green-700 font-semibold">Adicionais / Bônus</td>
                        <td className="p-2.5 text-center">—</td>
                        <td className="p-2.5 text-right">—</td>
                        <td className="p-2.5 text-right font-bold text-green-700">+{formatCurrency(receiptData.additions_value)}</td>
                      </tr>
                    )}
                    {receiptData.discounts_value > 0 && (
                      <tr>
                        <td className="p-2.5 text-red-700 font-semibold">Descontos Extras</td>
                        <td className="p-2.5 text-center">—</td>
                        <td className="p-2.5 text-right">—</td>
                        <td className="p-2.5 text-right font-bold text-red-700">-{formatCurrency(receiptData.discounts_value)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 font-black border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={3} className="p-3 text-right uppercase tracking-wider text-gray-800">
                        VALOR LÍQUIDO A PAGAR:
                      </td>
                      <td className="p-3 text-right text-base text-[#1B365D]">
                        {formatCurrency(receiptData.total_value)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {receiptData.notes && (
                <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
                  <strong className="text-gray-900 block mb-0.5">Observações:</strong>
                  {receiptData.notes}
                </div>
              )}

              {/* Statement & Signatures */}
              <div className="pt-6 space-y-8 text-xs text-gray-600">
                <p className="text-justify leading-relaxed">
                  Declaro que recebi da empresa <strong>S.O.S CRÉDITO</strong> a quantia líquida de{" "}
                  <strong>{formatCurrency(receiptData.total_value)}</strong> correspondente à apuração das diárias trabalhadas no período discriminado acima, nada mais havendo a reclamar quanto a este período.
                </p>

                <div className="grid grid-cols-2 gap-8 pt-8 text-center">
                  <div className="space-y-1">
                    <div className="border-t border-gray-400 pt-2 font-bold text-gray-900">
                      {receiptData.employee_name}
                    </div>
                    <span className="text-[11px] text-gray-500">Assinatura do Colaborador</span>
                  </div>

                  <div className="space-y-1">
                    <div className="border-t border-gray-400 pt-2 font-bold text-gray-900">
                      S.O.S Crédito — Gerência
                    </div>
                    <span className="text-[11px] text-gray-500">Responsável Financeiro / Operacional</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Fechar
              </Button>
              <Button
                type="button"
                className="bg-[#1B365D] hover:bg-[#244577] text-white gap-2 font-bold"
                onClick={handlePrint}
              >
                <FiPrinter className="w-4 h-4" />
                Imprimir Recibo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT RECORD MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Atualizar Lançamento de Diárias"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">Colaborador</label>
            <Input
              type="text"
              value={editingRecord?.employee_name || ""}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 uppercase">Status *</label>
              <Select
                options={[
                  { value: "pendente", label: "Pendente" },
                  { value: "aprovado", label: "Aprovado" },
                  { value: "pago", label: "Pago" },
                  { value: "cancelado", label: "Cancelado" },
                ]}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 uppercase">Data de Pagamento</label>
              <Input
                type="date"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">Observações</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] text-gray-900"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#1B365D] hover:bg-[#244577] text-white font-bold"
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
