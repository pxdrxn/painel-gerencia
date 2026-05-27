"use client";

import { useDashboard } from "@/hooks/useDashboard";
import PageHeader from "@/components/layout/PageHeader";
import MetricCard from "@/components/ui/MetricCard";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import BarChart from "@/components/charts/BarChart";

export default function DashboardPage() {
  const { metrics, isLoading } = useDashboard();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Carregando métricas...</div>;
  }

  if (!metrics) {
    return <div className="flex h-full items-center justify-center text-red-500">Erro ao carregar dados do dashboard.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Painel de Controle Unificado" 
        subtitle="Visão geral e métricas operacionais da S.O.S Crédito"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          value={metrics.total_employees.toString().padStart(2, '0')} 
          label="Funcionários" 
        />
        <MetricCard 
          value={metrics.total_units.toString().padStart(2, '0')} 
          label="Lojas" 
        />
        <MetricCard 
          value={metrics.on_vacation.toString().padStart(2, '0')} 
          label="Em Férias" 
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
          value={metrics.active_employees.toString().padStart(2, '0')} 
          label="Ativos" 
          variant="highlight"
        />
        <MetricCard 
          value={`${metrics.monthly_goal_pct.toFixed(0)}%`} 
          label="Meta Mês" 
          variant="highlight"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Faturamento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <BarChart 
                data={[metrics.production_total_month]} 
                labels={['Mês Atual']} 
                title="Faturamento (R$)" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
