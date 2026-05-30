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
import { formatCurrency, formatBRLInput, parseBRLFloat } from "@/lib/utils";

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
  const [localDaily, setLocalDaily] = useState<{ [unitId: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync server production quantities and goals with local state
  useEffect(() => {
    if (units.length) {
      const initialQty: { [unitId: string]: string } = {};
      const initialGoal: { [unitId: string]: string } = {};
      units.forEach(u => {
        const foundQty = ranking.find(r => r.unit_id === u.id);
        const qtyVal = foundQty ? foundQty.quantity : 0;
        initialQty[u.id] = formatBRLInput((qtyVal * 100).toFixed(0)) || "0,00";

        const foundGoal = goals.find(g => g.unit_id === u.id);
        const goalVal = foundGoal ? parseFloat(foundGoal.target_value) : 0;
        initialGoal[u.id] = formatBRLInput((goalVal * 100).toFixed(0)) || "0,00";
      });
      setLocalQuantities(initialQty);
      setLocalGoals(initialGoal);
      setLocalDaily({});
    }
  }, [ranking, goals, units]);

  const handleQuantityChange = (unitId: string, val: string) => {
    setLocalQuantities(prev => ({
      ...prev,
      [unitId]: formatBRLInput(val)
    }));
  };

  const handleGoalChange = (unitId: string, val: string) => {
    setLocalGoals(prev => ({
      ...prev,
      [unitId]: formatBRLInput(val)
    }));
  };

  const handleDailyChange = (unitId: string, val: string) => {
    setLocalDaily(prev => ({
      ...prev,
      [unitId]: formatBRLInput(val)
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    try {
      for (const unitId of Object.keys(localQuantities)) {
        const currentQty = parseBRLFloat(localQuantities[unitId]);
        const dailyQty = parseBRLFloat(localDaily[unitId] || "0");
        const targetVal = parseBRLFloat(localGoals[unitId]);

        const foundQty = ranking.find(r => r.unit_id === unitId);
        const originalQty = foundQty ? foundQty.quantity : 0;

        // O novo faturamento total é a soma do faturamento acumulado atual + o valor diário inserido
        const newQty = currentQty + dailyQty;

        let obs = foundQty?.observations || "";
        if (dailyQty > 0) {
          const today = new Date().toLocaleDateString("pt-BR");
          const logLine = `[${today}] Lançamento diário de +R$ ${formatBRLInput((dailyQty * 100).toFixed(0))}`;
          obs = obs ? `${obs}\n${logLine}` : logLine;
        } else if (currentQty !== originalQty) {
          const today = new Date().toLocaleDateString("pt-BR");
          const logLine = `[${today}] Ajuste manual para R$ ${formatBRLInput((currentQty * 100).toFixed(0))}`;
          obs = obs ? `${obs}\n${logLine}` : logLine;
        }

        await saveProduction(unitId, newQty, obs || undefined);
        await saveGoal(unitId, targetVal);
      }
      await refetch();
      setLocalDaily({});
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
                {units.map((unit) => {
                  const foundQty = ranking.find(r => r.unit_id === unit.id);
                  const logs = foundQty?.observations ? foundQty.observations.split("\n").filter(Boolean) : [];
                  
                  return (
                    <div key={unit.id} className="p-4 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0 space-y-3">
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="min-w-[120px]">
                          <span className="font-bold text-gray-900 block">{unit.name}</span>
                          <span className="text-xs text-gray-400">Telefone: {unit.phone || "-"}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-semibold uppercase">Meta: R$</span>
                            <Input 
                              type="text"
                              placeholder="0,00"
                              className="w-28 text-right font-medium text-gray-800"
                              value={localGoals[unit.id] ?? ""}
                              onChange={(e) => handleGoalChange(unit.id, e.target.value)}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-semibold uppercase">Acumulado: R$</span>
                            <Input 
                              type="text"
                              placeholder="0,00"
                              className="w-32 text-right font-semibold text-gray-900 bg-gray-50/50"
                              value={localQuantities[unit.id] ?? ""}
                              onChange={(e) => handleQuantityChange(unit.id, e.target.value)}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sky-600 text-xs font-bold uppercase">Mais (+): R$</span>
                            <Input 
                              type="text"
                              placeholder="0,00"
                              className="w-28 text-right font-bold text-sky-700 border-sky-200 focus:border-sky-500 focus:ring-sky-500 placeholder-sky-300"
                              value={localDaily[unit.id] ?? ""}
                              onChange={(e) => handleDailyChange(unit.id, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display preview if there is a daily amount typed */}
                      {localDaily[unit.id] && (
                        <div className="text-xs font-semibold text-sky-600 pl-1 animate-in fade-in duration-300">
                          Preview: Novo Total do Mês: R$ {formatBRLInput((
                            (parseBRLFloat(localQuantities[unit.id] || 0) + parseBRLFloat(localDaily[unit.id] || 0)) * 100
                          ).toFixed(0))}
                        </div>
                      )}

                      {/* Expandable release logs for the store */}
                      {logs.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-gray-600 border border-slate-100 space-y-1">
                          <span className="font-bold text-gray-700 block mb-1">Histórico de Lançamentos Diários:</span>
                          <div className="max-h-24 overflow-y-auto space-y-0.5 divide-y divide-slate-100 font-mono">
                            {logs.map((log, idx) => (
                              <div key={idx} className="py-0.5 text-[11px] text-gray-600">
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
