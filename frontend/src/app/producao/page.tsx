"use client";

import { useState, useEffect } from "react";
import { useProduction } from "@/hooks/useProduction";
import { useUnits } from "@/hooks/useUnits";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import LineChart from "@/components/charts/LineChart";
import { FiCheckCircle, FiSave } from "react-icons/fi";
import { formatCurrency } from "@/lib/utils";

const MONTHS = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" }
];

export default function ProductionPage() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const { ranking, monthly, summary, goals, saveProduction, saveGoal, refetch, isLoading: isProdLoading } = useProduction(month, year);
  const { units, isLoading: isUnitsLoading } = useUnits();

  const [localQuantities, setLocalQuantities] = useState<{ [unitId: string]: string }>({});
  const [localGoals, setLocalGoals] = useState<{ [unitId: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync server production quantities and goals with local state
  useEffect(() => {
    if (units.length) {
      const initialQty: { [unitId: string]: string } = {};
      const initialGoal: { [unitId: string]: string } = {};
      units.forEach(u => {
        const foundQty = ranking.find(r => r.unit_id === u.id);
        initialQty[u.id] = foundQty ? foundQty.quantity.toString() : "0";

        const foundGoal = goals.find(g => g.unit_id === u.id);
        initialGoal[u.id] = foundGoal ? foundGoal.target_value.toString() : "0";
      });
      setLocalQuantities(initialQty);
      setLocalGoals(initialGoal);
    }
  }, [ranking, goals, units]);

  const handleQuantityChange = (unitId: string, val: string) => {
    setLocalQuantities(prev => ({
      ...prev,
      [unitId]: val
    }));
  };

  const handleGoalChange = (unitId: string, val: string) => {
    setLocalGoals(prev => ({
      ...prev,
      [unitId]: val
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    try {
      for (const unitId of Object.keys(localQuantities)) {
        const qty = parseInt(localQuantities[unitId]) || 0;
        const targetVal = parseFloat(localGoals[unitId]) || 0;
        await saveProduction(unitId, qty, `Faturamento lançado pelo administrador em ${month}/${year}`);
        await saveGoal(unitId, targetVal);
      }
      await refetch();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar faturamento:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isProdLoading || isUnitsLoading;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Faturamento Mensal das Lojas" 
        subtitle="Acompanhamento e lançamento de faturamento por unidade"
        action={
          <div className="flex gap-4">
            <Select 
              options={MONTHS}
              value={month.toString()}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-36"
            />
            <Select 
              options={[{ value: "2025", label: "2025" }, { value: "2026", label: "2026" }]}
              value={year.toString()}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-24"
            />
          </div>
        }
      />

      {showSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-800 border border-green-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <FiCheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium">Lançamentos de faturamento e metas salvos com sucesso!</span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[#5d4ca3] text-sm font-semibold">Faturamento Total</span>
              <span className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(summary.total_quantity)}</span>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[#5d4ca3] text-sm font-semibold">Média por Loja</span>
              <span className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(summary.average_per_unit)}</span>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[#5d4ca3] text-sm font-semibold">Lojas Participantes</span>
              <span className="text-2xl font-bold text-gray-900 mt-2">{summary.unit_count}</span>
            </CardContent>
          </Card>
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[#5d4ca3] text-sm font-semibold">Crescimento Mensal Geral</span>
              <span className={`text-2xl font-bold mt-2 ${summary.growth_percentage === null ? 'text-gray-400 font-medium text-base' : summary.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.growth_percentage === null ? '—' : `${summary.growth_percentage >= 0 ? '+' : ''}${summary.growth_percentage.toFixed(1)}%`}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lançamento Inline */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
            <CardTitle>Lançamento de Faturamento e Metas</CardTitle>
            <Button 
              className="gap-2 shadow-sm"
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              loading={isSaving}
            >
              <FiSave /> Salvar Lançamentos
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Carregando lojas...</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {units.map((unit) => (
                  <div key={unit.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-gray-50/50 transition-colors">
                    <div>
                      <span className="font-semibold text-gray-900 block">{unit.name}</span>
                      <span className="text-xs text-gray-400">Telefone: {unit.phone || "-"}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs font-semibold uppercase">Meta: R$</span>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="0.00"
                          className="w-28 text-right pr-2 font-medium"
                          value={localGoals[unit.id] ?? "0"}
                          onChange={(e) => handleGoalChange(unit.id, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs font-semibold uppercase">Faturamento: R$</span>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="0.00"
                          className="w-28 text-right pr-2 font-medium"
                          value={localQuantities[unit.id] ?? "0"}
                          onChange={(e) => handleQuantityChange(unit.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico / Ranking */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Faturamento ({MONTHS[month - 1]?.label})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ranking.length === 0 ? (
                <div className="p-6 text-center text-gray-400 italic">Nenhum lançamento efetuado neste mês</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {ranking.map((rank) => (
                    <div key={rank.unit_id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          rank.position === 1 ? 'bg-amber-100 text-amber-800' :
                          rank.position === 2 ? 'bg-slate-100 text-slate-800' :
                          rank.position === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {rank.position}
                        </span>
                        <span className="font-medium text-gray-800">{rank.unit_name}</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatCurrency(rank.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução Anual Total ({year})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] flex items-center justify-center">
                {monthly.length === 0 ? (
                  <span className="text-gray-400 italic">Sem histórico de lançamentos para este ano</span>
                ) : (
                  <div className="w-full h-full">
                    <LineChart 
                      data={monthly.map(m => m.total)} 
                      labels={monthly.map(m => MONTHS[m.month - 1]?.label.substring(0, 3) || m.month.toString())} 
                      title="Total Faturado Mensal (Lojas)" 
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
