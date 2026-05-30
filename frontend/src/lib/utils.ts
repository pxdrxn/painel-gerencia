/**
 * Utility functions — Formatters e helpers.
 */

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatCPF(cpf: string): string {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

export function formatCurrency(value: number): string {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercentage(value: number): string {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ativo: "bg-green-100 text-green-800",
    ferias: "bg-purple-100 text-purple-800",
    afastado: "bg-yellow-100 text-yellow-800",
    inativo: "bg-red-100 text-red-800",
    desligado: "bg-red-100 text-red-800",
    completa: "bg-green-100 text-green-800",
    parcial: "bg-yellow-100 text-yellow-800",
    critica: "bg-red-100 text-red-800",
    folga: "bg-blue-100 text-blue-800",
    falta: "bg-orange-100 text-orange-800",
    agendada: "bg-indigo-100 text-indigo-800",
    confirmada: "bg-emerald-100 text-emerald-800",
    cancelada: "bg-gray-100 text-gray-800",
  };
  return map[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}

export function calculateRescisionValue(startDateStr: string | null | undefined, hireDateStr: string, terminationDateStr: string | null | undefined): { value: number; years: number; months: number; days: number } {
  if (!terminationDateStr) return { value: 0, years: 0, months: 0, days: 0 };
  
  const startStr = startDateStr || hireDateStr;
  if (!startStr) return { value: 0, years: 0, months: 0, days: 0 };

  const start = new Date(startStr);
  const end = new Date(terminationDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { value: 0, years: 0, months: 0, days: 0 };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const yearVal = years * 1000;
  const monthVal = months * (1000 / 12);
  const dayVal = days * 2.77;
  const total = parseFloat((yearVal + monthVal + dayVal).toFixed(2));

  return { value: total, years, months, days };
}

export function formatBRLInput(value: string): string {
  if (value === undefined || value === null) return "";
  const cleaned = value.replace(/\D/g, "");
  if (!cleaned) return "";
  const num = parseFloat(cleaned) / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function parseBRLFloat(value: string | number): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}
