// Vacation types

export interface Vacation {
  id: string;
  employee_id: string;
  employee_name?: string;
  hire_date?: string;
  start_date: string;
  end_date: string;
  status: "agendada" | "em_andamento" | "concluida" | "cancelada";
  observations: string | null;
  created_at: string;
}

export interface VacationCreate {
  employee_id: string;
  start_date: string;
  end_date: string;
  observations?: string;
}
