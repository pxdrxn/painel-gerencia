// Production types

export interface Production {
  id: string;
  employee_id: string;
  employee_name?: string;
  year: number;
  month: number;
  quantity: number;
  observations: string | null;
  created_at: string;
}

export interface ProductionRanking {
  position: number;
  employee_id: string;
  employee_name: string;
  quantity: number;
  unit_name?: string;
}

export interface ProductionSummary {
  year: number;
  month: number;
  total_quantity: number;
  employee_count: number;
  average_per_employee: number;
  growth_percentage: number | null;
}

// Dashboard types

export interface DashboardMetrics {
  total_employees: number;
  total_units: number;
  on_vacation: number;
  recent_hires: number;
  active_employees: number;
  monthly_goal_pct: number;
  efficiency: number;
  efficiency_label: string;
  production_total_month: number;
  production_growth_pct: number | null;
}
