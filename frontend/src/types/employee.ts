// Employee types

export interface Employee {
  id: string;
  name: string;
  cpf: string;
  phone: string | null;
  email: string | null;
  position: "atendente" | "panfletista" | "analista" | "gerente" | "supervisor";
  unit_id: string;
  unit_name?: string;
  hire_date: string;
  status: "ativo" | "inativo" | "ferias" | "afastado";
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
  position: string;
  unit_id: string;
  hire_date: string;
  status?: string;
  observations?: string;
}

export interface EmployeeUpdate {
  name?: string;
  phone?: string;
  email?: string;
  position?: string;
  unit_id?: string;
  status?: string;
  observations?: string;
}

export interface EmployeeStatusCount {
  ativo: number;
  inativo: number;
  ferias: number;
  afastado: number;
  total: number;
}
