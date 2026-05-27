// Unit types

export interface Unit {
  id: string;
  name: string;
  manager_name: string | null;
  phone: string | null;
  employee_count: number;
  status_operacional: "Ativa" | "Déficit";
  required_attendants: number;
  required_pamphletists: number;
  required_analysts: number;
  is_active: boolean;
  created_at: string;
}

export interface UnitAvailability {
  unit_id: string;
  unit_name: string;
  manager_name: string | null;
  attendants_count: number;
  pamphletists_count: number;
  analyst_name: string | null;
  availability_percent: number;
  status: "completa" | "parcial" | "critica";
}
