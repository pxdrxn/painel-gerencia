"""
Dashboard Schemas — Modelos de response do dashboard.
=======================================================
Conforme screenshot do PDF.
"""

from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    """Métricas consolidadas do Painel de Controle Unificado."""

    # Cards superiores (conforme PDF)
    total_employees: int = 0  # "FUNCIONÁRIOS"
    total_units: int = 0  # "LOJAS"
    on_vacation: int = 0  # "EM FÉRIAS"
    recent_hires: int = 0  # "CONTRATAÇÕES" (últimos 30 dias)

    # Cards inferiores (conforme PDF)
    active_employees: int = 0  # "ATIVOS"
    monthly_goal_pct: float = 0.0  # "META MÊS" (%)

    # Card destacado
    efficiency: float = 0.0  # Eficiência operacional (%)
    efficiency_label: str = "Operacional"  # "Operacional" | "Crítico" | "Excelente"

    # Dados adicionais para gráficos
    production_total_month: int = 0
    production_growth_pct: float | None = None
